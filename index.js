// --- All imports are now CommonJS (require) ---
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getDatabase, ServerValue } = require('firebase-admin/database');


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const { geohashForLocation, geohashQueryBounds, distanceBetween } = require('geofire-common');

const DATABASE_URL = 'https://indulge-93dc5-default-rtdb.firebaseio.com';


// --- This is the simple, correct way to import the JSON key ---
const serviceAccount = require('./service.json');

// --- Initialize Firebase Admin ---
const app = express();
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: DATABASE_URL
});

// --- Get references to Auth and Firestore services ---
const auth = getAuth();
const db = getDatabase(); // Get a reference to the Realtime Database

// --- Middleware ---
app.use(express.json());
app.use(cors());

// Your commented-out Mongoose connection
// mongoose.connect("mongodb+srv://anshul:anshul@indulge.jbvxebp.mongodb.net/?appName=indulge",{
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then((data)=>{
//  console.log("dsd")
// });

// app.use((req, res, next) => {
//   res.setHeader(
//     'Content-Security-Policy',
//     "default-src 'none'; connect-src 'self' https://assignment-backend-orpin.vercel.app;" // Add connect-src here
//     // Add other directives separated by semicolons
//     // Example: "script-src 'self';"
//   );
//   next();
// });

app.post('/api/signup', async (req, res) => {
  try {
    console.log(req.body);
    const { email, password} = req.body;
     const displayName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }); // big_red_donkey

    // --- 1. Validate input (basic) ---
    if (!email || !password || !displayName) {
      return res.status(400).send({ error: 'Email, password, and displayName are required.' });
    }
    if (password.length < 6) {
      return res.status(400).send({ error: 'Password must be at least 6 characters long.' });
    }

    // --- 2. Create user in Firebase Auth ---
    console.log('Attempting to create user in Auth...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
    });
    console.log(`Successfully created user in Auth. UID: ${userRecord.uid}`);

    console.log(userRecord);

    const userRef = db.ref(`users/${userRecord.uid}`);
    
    // Data based on your chat app's profile
    const userData = {
      uid: userRecord.uid,
      name: displayName,
      password:req.body.password,
      email: email,
      joined: ServerValue.TIMESTAMP // Use RTDB server timestamp
    };

    // Use set() to save the data at that specific path
    await userRef.set(userData);
    console.log(`Successfully created user profile in Realtime Database.`);
    // --- 4. Send success response ---
    // Return the user data (excluding sensitive info)
    res.status(201).send({
      message: 'User created successfully!',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
       
        displayName: userRecord.displayName
      }
    });

  } catch (error) {
    console.error('Error during signup:', error.message);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).send({ error: 'This email is already in use.' });
    }
    res.status(500).send({ error: 'Failed to create user.', details: error.message });
  }
});


app.post("/api/login",async (req,res)=>{
     const usersRef = db.ref('users');

  // 2. Create the query
  //    - Order all users by their 'email' child key
  //    - Find the one that is equal to the email we're looking for
  const query = usersRef.orderByChild('email').equalTo(req.body.email);

  try {
    // 3. Execute the query one time
    const snapshot = await query.once('value');
    // 4. Process the results
    if (snapshot.exists()) {
      // The result is an object where keys are the UIDs of matching users
      // e.g., { "uid-123-abc": { email: "...", ... } }
      const results = snapshot.val();
      // Get the first (and likely only) key from the results object
      const uid = Object.keys(results)[0];
      const user = results[uid];
      if(user.password==req.body.password){
      console.log(`Successfully found user by email. UID: ${uid}`);
      console.log(user);
      res.status(200).json("sucess")
      }else{
        console.log(user)
        res.status(400).json("wrong password")
      }
      
      return user;
      
    } else {
      console.log('No user found with that email address.');
      res.status(400).json("wrong email")

    }

  } catch (error) {
    console.error('Error finding user by email:', error);
            res.status(400).json(e.message)

  }
})

// app.post("/api/login",async (req,res)=>{
//     const {email, password}=req.body;

//     const user= await User.findOne({ email, password})
//     if(!user){
//       res.status(200).json("success")
//     }else{
//       res.status(200).json("Wrong Credentials")
//     }
// })




// app.get("/api/events",async (req,res)=>{
//    console.log(req.query)
//     const distance=req.query.distance;
//     const latitude=req.query.latitude;
//     const longitude=req.query.longitude;
   
//     const nearbyEvents = await findEventsNearby(longitude, latitude,Number(distance)); // 5km radius
//     res.status(200).json(nearbyEvents);
// })


app.get("/hello",(req,res)=>{
  res.status(200).json("success2");
})

// POST endpoint to create an event
// app.post('/api/events', async (req, res) => {
//   try {
//     const { name, description, longitude, latitude, image,address, date } = req.body;
    
//     const event = new Event({
//       name,
//       description,
//       location: {
//         type: 'Point',
//         coordinates: [parseFloat(longitude), parseFloat(latitude)]
//       },
//       address,
//       image,
//       date
//     });
    
//     await event.save();
//     res.status(201).json({ success: true, event });
//   } catch (error) {
//     console.log(error)
//     res.status(500).json({ error: error.message });
//   }
// });



// async function findEventsNearby(longitude, latitude, radiusInKm) {

//   // const allDocs = await Event.find({});
//   // const doc=allDocs.map((item)=>{
//   //   let distance=getDistanceFromLatLonInKm(latitude,longitude,item.location.coordinates[1],item.location.coordinates[0]);
//   //   console.log(distance);
//   //   if(distance<radiusInKm){
//   //       return item;
//   //   }
//   // })
//   // return doc;

//   const radiusInMeters = radiusInKm * 1000;
  
//   const events = await Event.find({
//     location: {
//       $near: {
//         $geometry: {
//           type: 'Point',
//           coordinates: [longitude, latitude]
//         },
//         $maxDistance: radiusInMeters // in meters
//       }
//     }
//   });
//   return events;



//   // let pipeline=[];
//   // pipeline.push({
//   //   $geoNear:{
//   //     near:{type:"Point", coordinates:[longitude, latitude]},
//   //     distanceField:"distance",
//   //     maxDistance:radiusInKm*1000,
//   //     spherical:true
//   //   }
//   // })
//   // let placeData=await Event.aggregate(pipeline);
//   // res.status(200).json(placeData)
// }

async function findNearbyEvents(centerLat, centerLng, radiusInMeters) {
  const center = [centerLat, centerLng];

  // 1. Get all the geohash "boxes" to query
  const bounds = geohashQueryBounds(center, radiusInMeters);
  const promises = [];

  // 2. Query Firebase for *each* bounding box
  for (const b of bounds) {
    const query = db.ref('events')
      .orderByChild('geohash')
      .startAt(b[0])
      .endAt(b[1]);
      
    promises.push(query.once('value'));
  }

  // 3. Wait for all the box queries to complete
  const snapshots = await Promise.all(promises);
  const matchingDocs = [];

  // 4. Filter the results
  for (const snap of snapshots) {
    if (snap.exists()) {
      // Loop through all results in this "box"
      snap.forEach((doc) => {
        const data = doc.val();
        const lat = data.location.latitude;
        const lng = data.location.longitude;

        // Calculate the *precise* distance from the center
        const distanceInKm = distanceBetween([lat, lng], center);
        const distanceInMeters = distanceInKm * 1000;

        // If it's *actually* within the radius, add it to our final list
        if (distanceInMeters <= radiusInMeters) {
          matchingDocs.push({ id: doc.key, ...data, distanceInMeters });
        }
      });
    }
  }

  // Sort by distance
  matchingDocs.sort((a, b) => a.distanceInMeters - b.distanceInMeters);

  return matchingDocs;
}

app.post("/api/events",async (req,res)=>{
  try{
    await addEventWithLocation(req.body, req.body.latitude, req.body.longitude);

  }catch(e){
      console.log(e.message)
  }
})

app.get("/api/events",async (req,res)=>{
  try{
    const doc=await addEventWithLocation(req.body, req.body.latitude, req.body.longitude);
    res.status(200).json(doc);
  }catch(e){
      console.log(e.message)
  }
})

async function addEventWithLocation(obj, lat, lng) {
  console.log(`Adding event: ${obj.title}`);
  
  // 1. Calculate the geohash for this location
  const hash = geohashForLocation([lat, lng]);

  // 2. Get a reference for a new event (auto-generated ID)
  const eventsRef = db.ref('events');
  const newEventRef = eventsRef.push(); // .push() creates a new unique ID

  // 3. Set the event data, including the geohash and location
  await newEventRef.set({
    title:obj.title,
    description:obj.description,
    image:obj.image,
    address:obj.address,
    room:generateRandomString(12),
    geohash: hash, // The geohash string
    location: {     // The precise location
      latitude: lat,
      longitude: lng
    }
  });

  console.log(`Event added with ID: ${newEventRef.key} and Geohash: ${hash}`);
}

function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Converts degrees to radians.
 * @param {number} deg Angle in degrees.
 * @returns {number} Angle in radians.
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


app.listen(3001);
