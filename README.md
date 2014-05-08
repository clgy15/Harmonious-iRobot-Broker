#Harmonious iRobot Broker

Node.js server broker designed to control tempo and to coordinate all robots. It's primary responsibility is a tempo server and the same time also takes care of communicating the state of each iRobot to all other iRobots.


##TCP Communication Protocol

####EMIT: Tick Packet Definitions:

	Byte 0: 1 => Loop, 2 => Beat
	Byte 1: # of Beats in the loop. Always include
	Byte 2: # of Robots playing. Always include
	Byte 3: Smallest unit of note length in multiples of 1/64th of a second.
	Byte 4: Octave Frequency (0 - 100)
	Byte 5: Third Frequency (0 - 100)
	Byte 6: Fifth Frequency (0 - 100)
	Byte 7: Seventh Frequency (0 - 100)
	Byte 8: Syncopation 0 if False, 1 if True
	Byte 9.... n - 2 : Each Playing iRobot's note on that beat, Length of beat currently being played
	End Bytes: '/r/n' to signify end of sequence
---
#####Special Case: 0 Robot's are playing
This is our initialization case. When the 1st robot comes on-line, the Broker server must send it the notes it will play instead of the notes the other robot's are playing for obvious reasons. User input currently has simple frequency insertion.

	Byte 0: 1 => Loop, 2 => Beat
	Byte 1: # of Beats in the loop.
	Byte 2: 0 Playing Robots <= Identifies special case for iRobot
	Byte 3: Smallest unit of note length in multiples of 1/64th of a second.
	Byte 4: Broker Entered note assigned to first Robot
	Byte 5: Length of note currently playing.

####RECEIVE: iRobot Initialization Protocol:
When a iRobot creates a new connection to the Broker Server, it is added to the Clients array of open connections and it will receive the same TCP packets above that the Playing iRobot's receive. However, it will not be identified as a Playing Robot until it returns the following Packet:

	Byte 0: 0x01 <= Current Initialization ID
	Byte 1, 2 - # of Beats: The note that it will play for each Beat in order, Length of note

####RECEIVE: iRobot Deinitialization Protocol:
When an iRobot **stops playing** (AKA: the Pause button is pressed), the following will be send:

	Byte 0: 0x00 <= Stop Playing ID

Any extra bytes are *Don't Cares*.
This will cause the Playing robot's counter to decrement, however the iRobot is not removed from the connections list

When an iRobot **goes offline or shuts down**, the iRobot will either send an 'end' signal or the server will encounter a *TIMEOUT*, or *ERR*. In all three cases, the default action by the server will be to decrement the Playing robot's counter and then to remove the iRobot from the connections list.

####RECEIVE: iRobot Waiting Protocol:
When an iRobot begins waiting for the next loop, it will emit a signal in order for the Frontend to display that's waiting.

	Byte 0: 0x02 <= Waiting ID

Any exra bytes are *Don't Cares*.

####RECEIVE: iRobot Listening Protocol:
When an iRobot begins Listening, it will emit a signal in order for the Frontend.

	Byte 0: 0x03 <= Waiting ID

Any exra bytes are *Don't Cares*.


## Backend Frontend Hooks
####Setup
When the user inputs the desired beat pattern, tempo etc into the Frontend, this hook is called.

If the TCP server has not been started then it will start the server, otherwise itll just update the root beat pattern.

####Harmonization Settings
When the user changes the Harmonization frequencies, the Frontend will generate a hook to update both the State variable and the server side variables.

These settings are emitted on every beat and loop.

####Robot Lifestage Hooks
**Robot Connection**: When a robot makes a connection, the Active State of the robot is initialized both in the TCP server and in the HTTP State. It has an initialization value of 0 or just online.

**Robot Waiting**: When a robot comes online and is waiting for a loop, it is set as the Active State of the robot both in the TCP server and in the HTTP State.

**Robot Listening**: When a robot starts listening, the Active State of the robot will be updated in the TCP server and in the HTTP State.

**Set Robot Pattern**: Once the robot announces to the TCP server the pattern it will begin playing, this is set both in the TCP server and in the HTTP State.

**Clear Robot Pattern**: When a robot stops playing but doesn't go offline, then the pattern will be cleared in the TCP server and the HTTP State.

**Robot Disconnection**: When a robot stops the code AKA shuts down, the robot must be removed from both the TCP server and the HTTP State.

##Compiled Songs:


####Bb Scale

	14
	70, 2
	72, 1
	74, 1
	75, 1
	77, 1
	79, 1
	81, 1
	82, 2
	81, 1
	79, 1
	77, 1
	75, 1
	74, 1
	72, 1


####Happy Lyric
	18
	0,1
	48, 1
	48, 2
	51, 2
	60, 2
	65, 1
	65, 1
	65, 3
	65, 2
	65, 2
	65, 3
	65, 1
	63, 1
	65, 2
	65, 2
	65, 2
	63, 1
	65, 4
