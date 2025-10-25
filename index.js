const express=require("express");
const cors=require("cors");
const app=express();
const mongoose=require("mongoose");
const Event=require("./models/Event");

app.use(express.json());
app.use(cors())
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; connect-src 'self' https://assignmentbackend-ty4p.onrender.com;" // Add connect-src here
    // Add other directives separated by semicolons
    // Example: "script-src 'self';"
  );
  next();
});
mongoose.connect("mongodb+srv://anshul:anshul@indulge.jhz3dxr.mongodb.net/",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then((data)=>{
	console.log("dsd")
});

app.get("/api/events",async (req,res)=>{
   console.log(req.query)
    const distance=req.query.distance;
    const latitude=req.query.latitude;
    const longitude=req.query.longitude;
   
    const nearbyEvents = await findEventsNearby(longitude, latitude,Number(distance)); // 5km radius
    res.status(200).json(nearbyEvents);
})


app.get("/hello",(req,res)=>{
  res.status(200).json("success2");
})

// POST endpoint to create an event
app.post('/api/events', async (req, res) => {
  try {
    const { name, description, longitude, latitude, image,address, date } = req.body;
    
    const event = new Event({
      name,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address,
      image,
      date
    });
    
    await event.save();
    res.status(201).json({ success: true, event });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});



async function findEventsNearby(longitude, latitude, radiusInKm) {

  const allDocs = await Event.find({});
  const doc=allDocs.map((item)=>{
    let distance=getDistanceFromLatLonInKm(latitude,longitude,item.location.coordinates[1],item.location.coordinates[0]);
    console.log(distance);
    if(distance<radiusInKm){
        return item;
    }
  })
  return doc;

  // const radiusInMeters = radiusInKm * 1000;
  
  // const events = await Event.find({
  //   location: {
  //     $near: {
  //       $geometry: {
  //         type: 'Point',
  //         coordinates: [longitude, latitude]
  //       },
  //       $maxDistance: radiusInMeters // in meters
  //     }
  //   }
  // });

  // let pipeline=[];
  // pipeline.push({
  //   $geoNear:{
  //     near:{type:"Point", coordinates:[longitude, latitude]},
  //     distanceField:"distance",
  //     maxDistance:radiusInKm*1000,
  //     spherical:true
  //   }
  // })
  // let placeData=await Event.aggregate(pipeline);
  // res.status(200).json(placeData)
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


app.listen(3000);
