import bcrypt from "bcrypt";
// import db from "./config/db.js"; 
// import dotenv from "dotenv";

// dotenv.config();

// async function createAdmin() {
//   const adminEmail = "waqashadi075@gmail.com";
//   const adminPassword = "Admin123@"; 
//   const adminName = "Admin";

//   try {
//     console.log("Checking if admin already exists...");
//     const [existing] = await db.execute("SELECT * FROM users WHERE email = ?", [adminEmail]);

//     if (existing.length > 0) {
//       console.log(`❌ Admin account with email ${adminEmail} already exists!`);
//       process.exit(0);
//     }

//     console.log("Hashing password...");
//     const saltRounds = 10;
//     const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

//     console.log("Inserting admin user into database...");
//     // UPDATED: Column name changed to 'password' based on your schema
//     const [result] = await db.execute(
//       `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
//       [adminName, adminEmail, passwordHash]
//     );

//     console.log("🎉 Admin created successfully!");
//     console.log(`Email: ${adminEmail}`);
//     console.log(`Password: ${adminPassword}`);
//     process.exit(0);
//   } catch (error) {
//     console.error("❌ Error creating admin user:", error);
//     process.exit(1);
//   }
// }

// createAdmin();


bcrypt.hash("sAVEtHEpATIENT123@", 10).then(console.log);