#Harmonious iRobot Broker

Node.js server broker designed to control tempo and to coordinate all robots. It's primary responsibility is a tempo server and the same time also takes care of communicating the state of each iRobot to all other iRobots.


##Communication Protocol

####Broker Server TCP packets for each Tick:

	Byte 0: 1 => Loop, 2 => Beat
	Byte 1: # of Beats in the loop. Always include
	Byte 2: # of Robots playing. Always include
	Byte 3: Smallest unit of note length in multiples of 1/64th of a second.
	Byte 4.... n - 2 : Each Playing iRobot's note on that beat, Length of beat currently being played
	End Bytes: '/r/n' to signify end of sequence

	Example:
	[1, 1, 1, 32, 55, 1, 13, 10] -- Loop, 1 Beat in Loop, 1 Robot Online, 32/64 seconds, Note 55, 1 length in beat, /r, /n
####iRobot Initialization Protocol:
When a iRobot creates a new connection to the Broker Server, it is added to the Clients array of open connections and it will receive the same TCP packets above that the Playing iRobot's receive. However, it will not be identified as a Playing Robot until it returns the following Packet:

	Byte 0: 0x01 <= Current Initialization ID
	Byte 1, 2 - # of Beats: The note that it will play for each Beat in order, Length of note

####iRobot Deinitialization Protocol:
When an iRobot **stops playing** (AKA: the Pause button is pressed), the following will be send:

	Byte 0: 0x00 <= Stop Playing ID

Any extra bytes are *Don't Cares*.
This will cause the Playing robot's counter to decrement, however the iRobot is not removed from the connections list

When an iRobot **goes offline or shuts down**, the iRobot will either send an 'end' signal or the server will encounter a *TIMEOUT*, or *ERR*. In all three cases, the default action by the server will be to decrement the Playing robot's counter and then to remove the iRobot from the connections list.

####Special Case #1: 0 Robot's are playing
This is our initialization case. When the 1st robot comes on-line, the Broker server must send it the notes it will play instead of the notes the other robot's are playing for obvious reasons. User input currently has simple frequency insertion.

	Byte 0: 1 => Loop, 2 => Beat
	Byte 1: # of Beats in the loop.
	Byte 2: 0 Playing Robots <= Identifies special case for iRobot
	Byte 3: Smallest unit of note length in multiples of 1/64th of a second.
	Byte 4: Broker Entered note assigned to first Robot
	Byte 5: Length of note currently playing.


##Compiled Songs

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
	19
	0,1
	48, 1
	48, 2
	51, 1
	60, 1
	60, 1
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
