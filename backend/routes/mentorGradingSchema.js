const express = require('express');
const mongoose = require('mongoose');
const MentorGrading = require('../models/MentorGradingSchema');
const router = express.Router();

// POST: Create or update Mentor Grading
router.post('/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const gradingData = req.body;

    // Check if the grading already exists for the given email
    let mentorGrading = await MentorGrading.findOne({ email });

    if (mentorGrading) {
      // Update the existing grading
      mentorGrading.grading = gradingData.grading || mentorGrading.grading;
      mentorGrading.remarks = gradingData.remarks || mentorGrading.remarks;
      mentorGrading.dates = gradingData.dates || mentorGrading.dates;
      mentorGrading.placement = gradingData.placement || mentorGrading.placement;
      mentorGrading.higherEducation = gradingData.higherEducation || mentorGrading.higherEducation;
      mentorGrading.initials = gradingData.initials || mentorGrading.initials;

      await mentorGrading.save();
      return res.status(200).json(mentorGrading);
    } else {
      // Create new grading entry if it doesn't exist
      mentorGrading = new MentorGrading({
        email,
        grading: gradingData.grading,
        remarks: gradingData.remarks,
        dates: gradingData.dates,
        placement: gradingData.placement,
        higherEducation: gradingData.higherEducation,
        initials: gradingData.initials,
      });

      await mentorGrading.save();
      return res.status(201).json(mentorGrading);
    }
  } catch (err) { next(err);
  }
});

// GET: Get Mentor Grading for a specific student
router.get('/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const mentorGrading = await MentorGrading.findOne({ email });

    if (!mentorGrading) {
      return res.status(200).json({
        email,
        grading: {
          generalDiscipline: [],
          communicationSkills: [],
          generalGrooming: [],
          behaviorWithPeers: [],
          behaviorWithFaculty: [],
          coCurricularActivities: [],
          extracurricularActivities: [],
          behaviorInHostel: [],
          overallGrading: [],
          disciplinaryActions: [],
        },
        remarks: [],
        dates: [],
        placement: {
          companyName: '',
          jobRole: '',
          package: null,
        },
        higherEducation: {
          universityName: '',
          courseName: '',
          country: '',
        },
        initials: {
          student: [],
          mentor: [],
        }
      });
    }

    return res.status(200).json(mentorGrading);
  } catch (err) { next(err);
  }
});

// PUT: Update specific grading details for a student
router.put('/:email/:semester/:subject', async (req, res, next) => {
    try {
      const { email, semester, subject } = req.params;
      const updatedGrades = req.body.grading;  // Assuming the grades come inside a 'grading' field
  
      // Check if updatedGrades is an array of numbers
      if (!Array.isArray(updatedGrades) || !updatedGrades.every(grade => typeof grade === 'number')) {
        return res.status(400).json({ message: 'Grades must be an array of numbers' });
      }
  
      const mentorGrading = await MentorGrading.findOne({ email });
  
      if (!mentorGrading) {
        return res.status(404).json({ message: 'Mentor grading not found' });
      }
  
      const gradingField = subject; // e.g., communicationSkills
  
      // Check if the grading field exists
      if (!mentorGrading.grading[gradingField]) {
        return res.status(404).json({ message: 'Subject not found in grading data' });
      }
  
      // Ensure the semester is within bounds (1-indexed)
      if (semester < 1 || semester > mentorGrading.grading[gradingField].length) {
        return res.status(400).json({ message: 'Invalid semester number' });
      }
  
      // Update the grade for the given semester and subject
      mentorGrading.grading[gradingField][semester - 1] = updatedGrades[0]; // Update with the first grade in the array
  
      await mentorGrading.save();
      return res.status(200).json(mentorGrading);
    } catch (err) { next(err);
    }
  });
  
// DELETE: Delete grading data for a specific student
router.delete('/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const mentorGrading = await MentorGrading.findOneAndDelete({ email });

    if (!mentorGrading) {
      return res.status(404).json({ message: 'Mentor grading not found' });
    }

    return res.status(200).json({ message: 'Grading data deleted successfully' });
  } catch (err) { next(err);
  }
});

module.exports = router;
