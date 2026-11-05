PROGRAM main
VAR
    pulse AT %QX0.0 : BOOL := FALSE;
    remote_command AT %QX0.1 : BOOL := FALSE;
    command_ack AT %QX0.2 : BOOL := FALSE;
    blink_timer : TON;
END_VAR

(* A local value changes without any cloud input. *)
blink_timer(IN := NOT blink_timer.Q, PT := T#10s);
IF blink_timer.Q THEN
    pulse := NOT pulse;
END_IF;

(* The command is simulated: no physical output is connected. *)
command_ack := remote_command;

END_PROGRAM