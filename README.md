#Harmonious iRobot Broker

Node.js server broker designed to control tempo and to coordinate all robots. It's primary responsibility is a tempo server and the same time also takes care of communicating the state of each iRobot to all other iRobots.


##Communication Protocol

####Broker Server TCP packets for each Tick:

	Byte 0: 1 => Loop, 2 => Beat, 0 => Neither??
	Byte 1: # of Beats in the loop. Always include
	Byte 2: # of Robots playing. Always include
	Byte 3 - # of Robots + 3: Each Playing iRobot's note on that beat.

####iRobot Initialization Protocol:
When a iRobot creates a new connection to the Broker Server, it is added to the Clients array of open connections and it will receive the same TCP packets above that the Playing iRobot's receive. However, it will not be identified as a Playing Robot until it returns the following Packet:

	Byte 0: 0x01 <= Current Initialization ID
	Byte 1 - # of Beats: The note that it will play for each Beat in order


####Special Case #1: 0 Robot's are playing
This is our initialization case. When the 1st robot comes on-line, the Broker server must send it the notes it will play instead of the notes the other robot's are playing for obvious reasons. User input currently has simple frequency insertion.

	Byte 0: 1 => Loop, 2 => Beat
	Byte 1: # of Beats in the loop.
	Byte 2: 0 Playing Robots <= Identifies special case for iRobot
	Byte 3: Broker Entered note assigned to first Robot


####Bb Scale

70
70
72
74
75
77
79
81
82
82
81
79
77
75
74
72
70
70
