import QtQuick
import Quickshell.Io
import qs.Ui
BarWidget {
  id: root
  moduleName: "org.epilogos.physis"
  property var snapshot: ({})
  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight
  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.snapshot.running ? "✧ ON" : root.snapshot.enabled ? "✧ ·" : "✧"
    tooltipText: "Physis: click to toggle the desktop scene · right-click for the studio"
    active: !!root.snapshot.running
    horizontalMargin: 7.5
    onPressed: function(mouseButton) {
      if (!root.bar) return
      if (mouseButton === Qt.RightButton) root.bar.run("physis open")
      else root.bar.run("physis overlay toggle")
    }
  }
  Process {
    id: status
    command: ["physis", "status"]
    stdout: StdioCollector { onStreamFinished: { try { root.snapshot = JSON.parse(text) } catch (_) {} } }
  }
  Timer { interval: 2000; running: true; repeat: true; triggeredOnStart: true; onTriggered: if (!status.running) status.running = true }
}
