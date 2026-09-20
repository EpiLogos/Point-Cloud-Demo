-- Dismiss on pointer motion after a short launch grace, without inhibiting idle.
local armed=false
mp.add_timeout(1.0,function() armed=true end)
mp.add_forced_key_binding('MOUSE_MOVE','physis-dismiss',function() if armed then mp.commandv('quit') end end)
