# Pop the Lock

Press Space / Enter, click the lock, or tap the button when the gold needle reaches the green zone. A hit reverses direction; tapping early or missing the target ends the run. In Levels mode, level N requires N consecutive hits. Each level increases speed and narrows the hit zone, within fixed limits. Retry the same level after losing; advance after winning. Highest cleared level and best Endless score are stored separately in your browser. P pauses; Esc opens the Home confirmation.

Run `npm run dev` from the Sky Club root directory. The UI defaults to English. Use the language selector for Vietnamese; changing language starts a new round and saves your preference.

## Time-based acceleration

Easy: +0.075 rad/s every 10 seconds. Normal (default): +0.20 rad/s every 10 seconds. Hard: +0.40 rad/s every 10 seconds. Extreme: +0.80 rad/s every 10 seconds. All modes share the same initial speed and target rules; only acceleration differs. Combined level and time-based speed is capped at 5.5 rad/s.

Only active play counts: pausing, the exit dialog, hidden tabs, and result screens do not accelerate the needle. Clearing a level keeps elapsed time; retrying resets time while keeping the level. Changing difficulty starts again at level 1. Difficulty is saved in your browser.

## Endless (default)

Keep tapping: each hit adds one point, reverses direction, and creates a new target. There are no breaks between levels. Mistiming or passing the target ends the run. Speed increases with active play time according to the four difficulty settings; the hit zone stays the same. Replay resets score and elapsed time. The Endless record is stored separately and shown on Home.

Choose Levels to play the level-based unlocking rules. Changing play style or difficulty starts a new run. Each game visit defaults to Endless, while the latest difficulty remains saved.

Extreme works in both Endless and Levels, accelerating twice as fast as Hard while keeping the 5.5 rad/s cap and the same tapping rules.
