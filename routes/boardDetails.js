const express = require('express');
const router = express.Router();
const Board = require('../models/boardSchema.js'); // Update model name to 'Board'
const moment = require('moment');
const verify = require('../middleware/verifyToken.js');

// Create API endpoint
router.post('/boardCreate', verify, async (req, res) => {
    const { title, priority, checklist, dueDate, cb, status } = req.body; // Update variable names

    try {
        if (!priority || !title || !checklist) {
            return res.status(400).json({
                errorMessage: "Bad Request",
            });
        }

        // Convert the date format if needed
        const formattedDate = dueDate ? moment(dueDate, 'MM/DD/YYYY').format('YYYY-MM-DD') : null;

        // Check if a board with the same details already exists
        const existingBoard = await Board.findOne({
            title,
            priority,
            checklist: checklist.split(','), // Convert checklist to array
            dueDate: formattedDate,
        });

        if (existingBoard) {
            return res.json({ message: "Board with the same details already exists" });
        }

        const boardDetails = new Board({
            title,
            priority,
            checklist: checklist.split(','), // Convert checklist to array
            dueDate: formattedDate,
            cb, // Updated variable name
            status, // Updated variable name
        });

        await boardDetails.save();
        res.json({ message: "New board created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: "Internal Server Error" });
    }
});


//get analytics
router.get('/getAnalytics', verify, async (req, res) => {

    try {
      const currentDate = new Date();
      // Count high priority documents
      const highPriorityCount = await Board.countDocuments({ priority: 'HIGH PRIORITY' });
  
      // Count low priority documents
      const lowPriorityCount = await Board.countDocuments({ priority: 'LOW PRIORITY' });
  
      // Count moderate priority documents
      const moderatePriorityCount = await Board.countDocuments({ priority: 'MODERATE PRIORITY' });
      //section count
      const TodoCount = await Board.countDocuments({ status: 'To do' });
      const BacklogCount = await Board.countDocuments({ status: 'Backlog' });
      const DoneCount = await Board.countDocuments({ status: 'Done' });
      const InprogressCount = await Board.countDocuments({ status: 'In progress' });
  
      const incompleteDuetasks = await Board.countDocuments({
        dueDate: { $lt: currentDate }, // Due date is in the future
        completed: false, // Task is not completed
        status:'Done'
      });
  
      // Send the count information in the response
      res.status(200).json({
        highPriority: highPriorityCount,
        lowPriority: lowPriorityCount,
        moderatePriority: moderatePriorityCount,
        IncompleteDuetasks: incompleteDuetasks,
        Todo: TodoCount,
        Backlog: BacklogCount,
        Done: DoneCount,
        Inprogress: InprogressCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });




//analytics duetask
router.put('/updateDueTask', verify, async (req, res) => {
    try {
        const { date } = req.body;

        await Board.updateMany(
            { dueDate: { $lt: date } },
            { $set: { completed: false } }
        );

        res.status(200).json({ message: "updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




//get all data
router.get('/getCardData', verify, async (req, res) => {
    const { duration, status } = req.query;
  
  
    try {
      let startDate;
  
      // Set the start date based on the specified duration
      switch (duration) {
        case 'week':
          startDate = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'today':
          startDate = new Date(new Date().setHours(0, 0, 0, 0));
          break;
        default:
          return res.status(400).json({ errorMessage: 'Invalid duration' });
      }
  
      // Query the database for documents within the specified date range
      const result = await Board.find({ createdDate: { $gte: startDate }, status: status });
  
      res.status(200).json({ data: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
//status update

router.put('/updateStatus', verify, async (req, res) => {
    try {
      const { id, newStatus } = req.body;
  
      // Check if id and newsection are provided
      if (!id || !newStatus) {
        return res.status(400).json({ errorMessage: 'Missing required fields in the request' });
      }
  
      // Update the section for the specified document
      await Board.findByIdAndUpdate(id, { status: newStatus });
  
      return res.status(200).json({ message: 'Section updated successfully' });
  
    } catch (error) {
      console.error('Error updating section:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  //boardDetails edit

  router.put("/edit/:userid", verify, async (req, res) => {
    try {
      const { title, priority, checklist, dueDate, completed, status, cb } = req.body;
      const _id = req.params.userid;
  
      // Check if required fields are provided
      if (!title || !priority || !checklist) {
        return res.status(400).json({ errorMessage: "Bad Request" });
      }
  
      // Find the existing board details by ID
      const existingBoardDetails = await Board.findById(_id);
  
      // Update the board details
      await Board.findByIdAndUpdate(_id, {
        $set: {
          title,
          priority,
          checklist: checklist?.split(','),
          dueDate,
          completed,
          status,
          cb
        }
      });
  
      return res.json({ message: "Board data updated successfully" });
    } catch (error) {
      console.error("Error updating board data:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
//userboard details
router.get("/edit/:userid", async (req, res) => {
    try {
      const _id = req.params.userid;
  
      if (!_id) {
        return res.status(400).json({
          errorMessage: "Bad Request: Missing user ID",
        });
      }
  
      const existingBoardDetails = await Board.findById(_id);
  
      if (!existingBoardDetails) {
        return res.status(404).json({
          errorMessage: "Board not found",
        });
      }
  
      const { title, priority, checklist, cb, dueDate } = existingBoardDetails;
  
      return res.status(200).json({
        message: "Success",
        title,
        priority,
        checklist,
        cb: cb || [],
        dueDate: dueDate || null
      });
    } catch (error) {
      console.error("Error fetching board details:", error);
      return res.status(500).json({
        errorMessage: "Internal Server Error",
      });
    }
  });

  // Board delete
router.delete('/delete/:id', verify, async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBoard = await Board.findByIdAndDelete(id);
        if (!deletedBoard) {
            return res.status(404).json({ error: 'Board not found' });
        }

        res.status(200).json({ success: 'Board deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: `Error deleting board: ${error.message}` });
    }
});
  

module.exports = router;
