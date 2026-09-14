#include <gtk/gtk.h>
#include <webkit2/webkit2.h>
#include "gtk-layer-shell.h"
// A separate native host keeps GPU and web-process failures away from omarchy-shell.
static GHashTable *windows;
static gboolean screensaver = FALSE;
static void close_saver(GtkWidget *widget, gpointer unused) { if (gtk_main_level()>0) gtk_main_quit(); }
static gboolean dismiss(GtkWidget *widget, GdkEvent *event, gpointer unused) {
  gtk_main_quit();
  return TRUE;
}
static const char *render_url;
static void input_region(GtkWidget *widget, gpointer unused) {
  GdkWindow *window = gtk_widget_get_window(widget);
  if (!window) return;
  cairo_region_t *empty = cairo_region_create();
  gdk_window_input_shape_combine_region(window, empty, 0, 0);
  cairo_region_destroy(empty);
  gdk_window_set_pass_through(window, TRUE);
}
static gboolean draw_clear(GtkWidget *widget, cairo_t *cr, gpointer unused) {
  cairo_set_operator(cr, CAIRO_OPERATOR_SOURCE); cairo_set_source_rgba(cr,0,0,0,0); cairo_paint(cr); cairo_set_operator(cr,CAIRO_OPERATOR_OVER); return FALSE;
}
static void engine_ready(WebKitUserContentManager *manager, WebKitJavascriptResult *result, gpointer unused) {
  char *message=jsc_value_to_string(webkit_javascript_result_get_js_value(result));
  if (g_strcmp0(message,"ready")==0) g_print("PHYSIS_ENGINE_READY\n");
  else g_print("PHYSIS_FRAME_STATS %s\n",message);
  g_free(message);
}
static void evaluated(GObject *source, GAsyncResult *result, gpointer unused) {
  GError *error=NULL;
  JSCValue *value=webkit_web_view_evaluate_javascript_finish(WEBKIT_WEB_VIEW(source),result,&error);
  if(error){g_printerr("Physis diagnostic: %s\n",error->message);g_error_free(error);return;}
  char *text=jsc_value_to_string(value);g_print("PHYSIS_DIAGNOSTIC %s\n",text);g_free(text);g_object_unref(value);
}
static gboolean inspect_page(gpointer view) {
  webkit_web_view_evaluate_javascript(WEBKIT_WEB_VIEW(view),"JSON.stringify({ready:document.readyState,canvases:document.querySelectorAll('canvas').length,visibility:document.visibilityState,phase:document.querySelector('canvas')?.dataset.phase})",-1,NULL,NULL,NULL,evaluated,NULL);
  g_object_unref(view);return G_SOURCE_REMOVE;
}
static void load_changed(WebKitWebView *view, WebKitLoadEvent event, gpointer unused) {
  if (event == WEBKIT_LOAD_FINISHED) { g_print("PHYSIS_PAGE_LOADED\n");g_timeout_add_seconds(3,inspect_page,g_object_ref(view)); }
}
static gboolean load_failed(WebKitWebView *view, WebKitLoadEvent event, const char *uri, GError *error, gpointer unused) {
  g_printerr("Physis page failed to load: %s\n", error->message); exit(1); return FALSE;
}
static void web_failed(WebKitWebView *view, WebKitWebProcessTerminationReason reason, gpointer unused) {
  g_printerr("Physis web process terminated: %d\n", reason); exit(1);
}
static void monitor_added(GdkDisplay *display, GdkMonitor *monitor, gpointer unused) {
  if (g_hash_table_contains(windows, monitor)) return;
  GtkWidget *window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
  gtk_window_set_accept_focus(GTK_WINDOW(window), screensaver);
  if (screensaver) {
    gtk_window_set_title(GTK_WINDOW(window), "Physis live screensaver");
    gtk_window_fullscreen(GTK_WINDOW(window));
    g_signal_connect(window,"destroy",G_CALLBACK(close_saver),NULL);
  } else {
  gtk_layer_init_for_window(GTK_WINDOW(window));
  gtk_layer_set_monitor(GTK_WINDOW(window), monitor);
  gtk_layer_set_namespace(GTK_WINDOW(window), "physis-overlay");
  gtk_layer_set_layer(GTK_WINDOW(window), GTK_LAYER_SHELL_LAYER_OVERLAY);
  gtk_layer_set_keyboard_mode(GTK_WINDOW(window), GTK_LAYER_SHELL_KEYBOARD_MODE_NONE);
  gtk_layer_set_exclusive_zone(GTK_WINDOW(window), -1);
  for (int edge=0; edge<4; edge++) gtk_layer_set_anchor(GTK_WINDOW(window), edge, TRUE);
  }
  gtk_widget_set_visual(window,gdk_screen_get_rgba_visual(gtk_widget_get_screen(window)));
  gtk_widget_set_app_paintable(window,TRUE);
  g_signal_connect(window,"draw",G_CALLBACK(draw_clear),NULL);
  WebKitWebContext *context=webkit_web_context_new_ephemeral();
  GtkWidget *view=webkit_web_view_new_with_context(context);
  g_object_unref(context);
  WebKitUserContentManager *manager=webkit_web_view_get_user_content_manager(WEBKIT_WEB_VIEW(view));
  webkit_user_content_manager_register_script_message_handler(manager,"physisReady");
  g_signal_connect(manager,"script-message-received::physisReady",G_CALLBACK(engine_ready),NULL);
  WebKitUserScript *diagnostics=webkit_user_script_new(
    "window.addEventListener('physis-ready',()=>window.webkit.messageHandlers.physisReady.postMessage('ready'));"
    "window.addEventListener('physis-frame',e=>window.webkit.messageHandlers.physisReady.postMessage(JSON.stringify(e.detail)));"
    "window.addEventListener('error',e=>console.error('PHYSIS_SCRIPT_ERROR '+(e.message||e.target.src)));"
    "window.addEventListener('unhandledrejection',e=>console.error('PHYSIS_SCRIPT_ERROR '+String(e.reason)));",
    WEBKIT_USER_CONTENT_INJECT_TOP_FRAME, WEBKIT_USER_SCRIPT_INJECT_AT_DOCUMENT_START, NULL, NULL);
  webkit_user_content_manager_add_script(manager,diagnostics);
  webkit_user_script_unref(diagnostics);
  GdkRGBA transparent={0,0,0,screensaver?1:0};
  webkit_web_view_set_background_color(WEBKIT_WEB_VIEW(view),&transparent);
  WebKitSettings *settings=webkit_web_view_get_settings(WEBKIT_WEB_VIEW(view));
  webkit_settings_set_enable_webgl(settings,TRUE);
  webkit_settings_set_enable_write_console_messages_to_stdout(settings,TRUE);
  webkit_web_view_set_is_muted(WEBKIT_WEB_VIEW(view),TRUE);
  g_signal_connect(view,"load-changed",G_CALLBACK(load_changed),NULL);
  g_signal_connect(view,"load-failed",G_CALLBACK(load_failed),NULL);
  g_signal_connect(view,"web-process-terminated",G_CALLBACK(web_failed),NULL);
  gtk_container_add(GTK_CONTAINER(window),view);
  if (!screensaver) {
  g_signal_connect(window,"map",G_CALLBACK(input_region),NULL);
  g_signal_connect(view,"map",G_CALLBACK(input_region),NULL);
  } else {
    gtk_widget_add_events(window,GDK_POINTER_MOTION_MASK|GDK_BUTTON_PRESS_MASK|GDK_KEY_PRESS_MASK|GDK_SCROLL_MASK);
    g_signal_connect(window,"key-press-event",G_CALLBACK(dismiss),NULL);
    g_signal_connect(view,"key-press-event",G_CALLBACK(dismiss),NULL);
  }
  webkit_web_view_load_uri(WEBKIT_WEB_VIEW(view),render_url);
  g_hash_table_insert(windows,g_object_ref(monitor),window);
  gtk_widget_show_all(window);
  if (!screensaver) { input_region(window,NULL); input_region(view,NULL); }
}
static void monitor_removed(GdkDisplay *display,GdkMonitor *monitor,gpointer unused) { g_hash_table_remove(windows,monitor); }
int main(int argc,char **argv) {
  setvbuf(stdout,NULL,_IOLBF,0);
  screensaver=argc==3 && g_strcmp0(argv[2],"--screensaver")==0;
  if (screensaver) { g_set_prgname("org.omarchy.screensaver"); argc=2; }
  gtk_init(&argc,&argv);
  if(argc!=2 || !g_str_has_prefix(argv[1],"http://127.0.0.1:")) { g_printerr("Usage: physis-overlay http://127.0.0.1:PORT/render\n"); return 2; }
  if(!screensaver && !gtk_layer_is_supported()) { g_printerr("Wayland layer-shell is unavailable\n");return 1; }
  render_url=argv[1];
  windows=g_hash_table_new_full(g_direct_hash,g_direct_equal,g_object_unref,(GDestroyNotify)gtk_widget_destroy);
  GdkDisplay *display=gdk_display_get_default();
  for(int i=0;i<(screensaver?1:gdk_display_get_n_monitors(display));i++) monitor_added(display,gdk_display_get_monitor(display,i),NULL);
  if(!screensaver) g_signal_connect(display,"monitor-added",G_CALLBACK(monitor_added),NULL);
  g_signal_connect(display,"monitor-removed",G_CALLBACK(monitor_removed),NULL);
  gtk_main();g_hash_table_destroy(windows);return 0;
}
