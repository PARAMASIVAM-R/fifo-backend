const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const Godown = require("../models/godownModel");
const PDS = require("../models/pdsModel");

exports.register = async (req, res) => {
    try {
      console.log('Incoming registration data:', JSON.stringify(req.body, null, 2));
        const { role, id, name, district, password,godownname, pdslocation } = req.body;

        let user;
        // console.log('backend user   :', user)

        if (role === "Admin") {
            user = new Admin({ role, id, name, district, password });
        } 
        else if (role === "Godown Incharge") {
            if (!id) {
                return res.status(400).json({ message: "Godown ID is required for Godown Incharge" });
            }

          

            user = new Godown({
                role, id, name, district, password,
                godownname  // ✅ Store godownname
            });}
            else if (role === "PDS Incharge") {
              if (!pdslocation || !godownname) {
                  return res.status(400).json({ message: "PDS Location and Godown name are required" });
              }
  
              // ✅ Ensure that `godownId` is the manually assigned ID, not an ObjectId
              const godown = await Godown.findOne({  godownname });
              if (!godown) {
                  return res.status(404).json({ message: "Godown not found" });
              }
  
              user = new PDS({
                  role, id, name, district, password,
                  pdslocation,  // ✅ Store PDS location
                  godownname: godown.godownname  // ✅ Store the correct godown name
              });
          } 
          else {
            return res.status(400).json({ message: "Invalid role specified" });
        }
        // ✅ Hash Password Before Saving
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(201).json({ message: `${role} registered successfully!` });
        console.log('backend user   :', user)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}



exports.login = async (req, res) => {
  try {
    console.log("Received login request:", req.body); // ✅ Log request payload

    const { role, id, password } = req.body;
    let user;

    switch (role) {
      case "Admin":
        user = await Admin.findOne({ id });
        break;
      case "Godown Incharge":
        user = await Godown.findOne({ id });
        console.log("Godown User Found:", user);
        break;
      case "PDS Incharge":
        user = await PDS.findOne({ id });
        console.log("PDS User Found:", user); // ✅ Log PDS user object
        break;
      default:
        return res.status(400).json({ message: "Invalid role selected" });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid ID or Password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid ID or Password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role ,
        name: user.name,
        district: user.district || "",
        pdslocation: user.pdslocation || "",
        godownName: user.godownName || "",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Login Successful:", { id: user.id, role: user.role }); // ✅ Log success

    res.json({
      token,
      role: user.role,
      name: user.name,
      id: user.id,
      district: user.district || "",
      pdslocation: user.pdslocation || "",
      godownName: user.godownName || "",
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// exports.login = async (req, res) => {
//     try {
//       const { role, id, password } = req.body; // ✅ Accept role from request body
//       let user;
  
//       // ✅ Find the user based on role

//       console.log('role      :',id," ", password ,"", role)
//       switch (role) {
//         case "Admin":
//           user = await Admin.findOne({ id });
//           break;
//         case "Godown Incharge":
//           user = await Godown.findOne({ id });
//           break;
//         case "PDS Incharge":
//           user = await PDS.findOne({ id });
//           break;
//         default:
//           return res.status(400).json({ message: "Invalid role selected" });
//       }
  
//       // ✅ Check if user exists
//       if (!user) {
//         return res.status(400).json({ message: "Invalid ID or Password" });
//       }
  
//       // ✅ Compare Password
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: "Invalid ID or Password" });
//       }
  
//       // ✅ Generate JWT Token with Role & User Data
//       const token = jwt.sign(
//         {
//           id: user.id,
//           role: user.role,
//           name: user.name,
//           district: user.district || "", // Add district if available
//           pdslocation: user.pdslocation || "", // Include pdslocation for PDS if available
//           godownName: user.godownName || "", // Include godownName for Godown if available
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );
  
//       // ✅ Return Token & User Details
//       res.json({
//         token,
//         role: user.role,
//         name: user.name,
//         id: user.id,
//         district: user.district || "",
//         pdslocation: user.pdslocation || "",
//         godownName: user.godownName || "",
//       });
//     } catch (err) {
//       console.error("Login Error:", err.message);
//       res.status(500).json({ error: "Server error" });
//     }
//   };
  

// exports.login = async (req, res) => {
//     try {
//         const {  id, password } = req.body;
//         let user;

//         // ✅ Find user from correct model
//         user = await PDS.findOne({ id }) || 
//                await Godown.findOne({ id }) || 
//                await Admin.findOne({ id });

//         if (!user) {
//             return res.status(400).json({ message: "Invalid ID or Password" });
//         }

//         // ✅ Compare Password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: "Invalid ID or Password" });
//         }

//         // ✅ FIX: Ensure "role" is included in JWT
//         const token = jwt.sign(
//             { id: user.id, role: user.role, name: user.name, district: user.district },
//             process.env.JWT_SECRET,
//             { expiresIn: "1h" }
//         );

//         res.json({ token, user: { id: user.id, role: user.role, name: user.name, district: user.district } });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };
