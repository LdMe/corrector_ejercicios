import Course from "../../models/courseModel.js";
import Subject from "../../models/subjectModel.js";
import Exercise from "../../models/exerciseModel.js";
import Attempt from "../../models/attemptModel.js";

import { isValidObjectId } from "../../utils/helpers.js";
import { getAllUsers,getUser } from "../user/userController.js";
import { getAllSubjects } from "../subject/subjectController.js";
// Crud for courses
/**
 * create a course
 * @param {Object} data
 * @returns {Object} course
 */
const createCourse = async (data) => {
    try {
        const course = new Course(data);
        await course.save();
        return course;
    } catch (err) {
        console.error(err);
        return null;
    }
}

/**
 * get all courses
 * @param {String} query
 * @param {Number} limit
 * @param {String} id
 * @returns {Array} courses
 */
const getAllCourses = async (id = null, query = "", limit = 20) => {
    try {
        let filter = {};
        let courses = [];
        if (query && query.length > 0) {
            filter = {
                $and: [
                    {
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { branch: { $regex: query, $options: 'i' } },
                        ],
                    },
                ]
            };
        }
        // if there is an id, get courses related to that user
        if (isValidObjectId(id)) {
            const user =getUser(id).populate('courses');
            // if user is student, get courses from user.courses
            if (user.role == 'student') {
                courses = user.courses.filter(course => course.name.match(query));
                if (limit) {
                    return courses.slice(0, parseInt(limit));
                }
            }
            else {
                filter["$and"].push({ _id: { $eq: id } });
                if (limit) {
                    courses = await Course.find(filter).limit(parseInt(limit));
                }
                courses = await Course.find(filter);
            }
        }
        else {
            if (limit) {
                courses = await Course.find(filter).limit(parseInt(limit));
            }
            courses = await Course.find(filter);
        }
        return courses;
    } catch (err) {
        console.error(err);
        return [];
    }
}


/**
 * get a single course
 * @param {String} id
 * @returns {Object} course
 */
const getCourse = async (id) => {
    try {
        const course = await Course.findById(id).populate('teachers');
        if (course == null) {
            return null;
        }
        const subjects = await getAllSubjects(course._id);
        const students = await getAllUsers(null, null, course._id);
        const response = {
            ...course._doc,
            subjects,
            students
        }
        return response;
    }
    catch (err) {
        console.error(err);
        return null;
    }
}

/**
 * update a single course
 * @param {String} id
 * @param {Object} data
 * @returns {Object} course
 */
const updateCourse = async (id, data) => {
    try {
        const course = await Course.findById(id);
        if (course == null) {
            return null;
        }
        if (data.name != null) {
            course.name = data.name;
        }
        if (data.year != null) {
            course.year = data.year;
        }
        if (data.month != null) {
            course.month = data.month;
        }
        if (data.branch != null) {
            course.branch = data.branch;
        }
        await course.save();
        return course;
    } catch (err) {
        console.error(err);
        return null;
    }
}

/**
 * delete a single course
 * @param {String} id
 * @returns {Object} course
 */
const deleteCourse = async (id) => {
    try {
        const course = await Course.findById(id);
        if (course == null) {
            return null;
        }
        // delete course from students and subjects
        const students = await getAllUsers(null, null, course._id);
        await Promise.all(students.map(async (studentObject) => {
            const student = await getUser(studentObject._id);
            if (student == null) {
                return null;
            }
            student.courses.pull(course);
            await student.save();
        }));
        //delete all subjects, exercises and attempts related to that course
        const subjects = await getAllSubjects(course._id);
        const exercises = await Exercise.find({ subject: { $in: subjects } });
        const attempts = await Attempt.find({ exercise: { $in: exercises } });
        await Attempt.deleteMany({ _id: { $in: attempts } });
        await Exercise.deleteMany({ _id: { $in: exercises } });
        await Subject.deleteMany({ _id: { $in: subjects } });
        /* subjects.forEach(async (subject) => {
            subject.course = null;
            console.log("subject",subject);
            await subject.save();
        }); */

        await Course.deleteOne({ _id: course._id });
        return course;
    } catch (err) {
        console.error(err);
        return null;
    }
}


/**
 * add a teacher to a course
 * @param {String} courseId
 * @param {String} teacherId
 * @returns {Object} course
 */
const addTeacher = async (courseId, teacherId) => {
    try {
        const course = await Course.findById(courseId).populate('teachers');
        if (course == null) {
            return null;
        }
        const teacher = await getUser(teacherId);
        if (teacher == null) {
            return null;
        }
        if (teacher.role != 'teacher' && teacher.role != 'admin') {
            return null;
        }
        if (course.teachers.some(t => t._id.equals(teacher._id))) {
            return null;
        }
        course.teachers.push(teacher);
        await course.save();
        return course;
    } catch (err) {
        console.error(err);
        return null;
    }
}

/**
 * remove a teacher from a course
 * @param {String} courseId
 * @param {String} teacherId
 * @returns {Object} course
 */
const removeTeacher = async (courseId, teacherId) => {
    try {
        const course = await Course.findById(courseId);
        if (course == null) {
            return null;
        }
        const teacher = await getUser(teacherId);
        if (teacher == null) {
            return null;
        }
        course.teachers.pull(teacher);
        await course.save();
        return course;
    } catch (err) {
        console.error(err);
        return null;
    }
}

/**
 * enroll a student in a course
 * @param {String} courseId
 * @param {String} studentId
 * @returns {Object} user
 */
const enrollStudent = async (courseId, studentId) => {
    try {
        const user = await getUser(studentId);
        if (user == null) {
            return null;
        }
        const course = await Course.findById(courseId);
        if (course == null) {
            return null;
        }
        /* if (user.role != 'student') {
            return null;
        } */
        if (user.courses.includes(courseId)) {
            return null;
        }
        user.courses.push(courseId);
        await user.save();
        return user;

    }
    catch (err) {
        console.error(err)
        return null;
    }
}

/**
 * unenroll a student from a course
 * @param {String} courseId
 * @param {String} studentId
 * @returns {Object} user
 */
const unenrollStudent = async (courseId, studentId) => {
    try {
        const user = await getUser(studentId);
        if (user == null) {
            return null;
        }
        const course = await Course.findById(courseId);
        if (course == null) {
            return null;
        }
        /* if (user.role != 'student') {
            return null;
        } */
        user.courses.pull(courseId);
        await user.save();
        return user;
    }
    catch (err) {
        console.error(err)
        return null;
    }
}

export {
    createCourse,
    getAllCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    addTeacher,
    removeTeacher,
    enrollStudent,
    unenrollStudent
};
export default {
    createCourse,
    getAllCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    addTeacher,
    removeTeacher,
    enrollStudent,
    unenrollStudent
};