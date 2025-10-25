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
   
    const nearbyEvents = await findEventsNearby(longitude,  latitude,Number(distance)); // 5km radius
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
  const radiusInMeters = radiusInKm * 1000;
  
  const events = await Event.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInMeters // in meters
      }
    }
  });
  
  return events;
}


app.listen(3000);
