import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import User from '../src/models/user.model.js';
import Job from '../src/models/job.model.js';
import Company from '../src/models/company.model.js';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hackathon";
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB Connected for Seeding");
    }
    catch (err) {
        console.error("Connection Error:", err);
        process.exit(1);
    }
};
const seedData = async () => {
    await connectDB();
    console.log("Clearing existing data...");
    console.log("Seeding Users...");
    const users = [];
    const skillsList = ["React", "Node.js", "Python", "Java", "MongoDB", "AWS", "Design", "Marketing"];
    for (let i = 0; i < 20; i++) {
        const user = new User({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: "password123",
            phoneNumber: faker.phone.number(),
            skills: faker.helpers.arrayElements(skillsList, { min: 2, max: 5 }),
            experience: faker.number.int({ min: 0, max: 15 }),
            resume: faker.internet.url(),
            preferredLocations: [faker.location.city(), "Remote"],
            expectedSalary: faker.number.int({ min: 40000, max: 150000 }),
            isProfileComplete: true,
            role: 'user'
        });
        users.push(await user.save());
    }
    console.log(`Created ${users.length} users.`);
    console.log("Seeding Companies...");
    console.log("Seeding Companies...");
    const companies = [];
    for (let i = 0; i < 5; i++) {
        const companyName = faker.company.name();
        const companyEmail = faker.internet.email({ firstName: companyName });
        const company = new Company({
            name: companyName,
            email: companyEmail,
            password: "password123",
            jobsIds: []
        });
        companies.push(await company.save());
    }
    console.log("Seeding Jobs...");
    const jobs = [];
    for (let i = 0; i < 35; i++) {
        const company = faker.helpers.arrayElement(companies);
        const job = new Job({
            title: faker.person.jobTitle(),
            company: company.name,
            companyEmail: company.email,
            companyPassword: company.password || "password123",
            requiredSkills: faker.helpers.arrayElements(skillsList, { min: 2, max: 4 }),
            minExperience: faker.number.int({ min: 0, max: 5 }),
            salary: faker.number.int({ min: 50000, max: 200000 }),
            jobType: faker.helpers.arrayElement(["Full-time", "Part-time", "Contract", "Remote"]),
            location: faker.location.city(),
            description: faker.lorem.paragraph(),
            peopleIds: [],
        });
        const savedJob = await job.save();
        jobs.push(savedJob);
        company.jobsIds.push(savedJob._id.toString());
        await company.save();
    }
    console.log(`Created ${jobs.length} jobs.`);
    console.log("Assigning Applicants...");
    for (const job of jobs) {
        if (Math.random() > 0.2) {
            const applicantsCount = faker.number.int({ min: 1, max: 8 });
            const selectedUsers = faker.helpers.arrayElements(users, applicantsCount);
            for (const user of selectedUsers) {
                user.appliedJobs.push(job._id);
                await user.save();
                job.peopleIds.push(user._id);
            }
            await job.save();
        }
    }
    console.log("Seeding Complete!");
    process.exit(0);
};
seedData();
//# sourceMappingURL=seed.js.map