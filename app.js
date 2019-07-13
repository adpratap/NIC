const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const bodyPaser = require('body-parser');
const methodOverride=require('method-override');


const app = express();
app.use(bodyPaser.json());
app.use(methodOverride('_method'));
app.set('view engine','ejs');

const mongoURI = 'mongodb+srv://adpdb:7011692870@cluster0-0mnvs.mongodb.net/test?retryWrites=true&w=majority';

const conn = mongoose.createConnection(mongoURI);

let gfs;

conn.once('open',()=>{
    gfs = Grid(conn.db,mongoose.mongo);
    gfs.collection('uploads');
})

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });


app.get('/',(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        if(!files || files.length === 0){
           res.render('index',{files:false});
        
        }else{

            files.map(file =>{
                if(file.contentType === 'image/jpeg'|| file.contentType ==='image/png'){
                   file.isImage = true; 
                }else{
                    file.isImage = false;
                }
            });

            res.render('index',{files:files});

        }
    
    
    });
});

app.post('/upload',upload.single('file'),(req,res)=>{
    //res.json({file: req.file});
    res.redirect('/');

});

//get files
app.get('/files',(req,res)=>{

gfs.files.find().toArray((err,files)=>{
    if(!files || files.length === 0){
        return res.status(404).json({
            err : 'No files Exist'
        });
    }
    return res.json(files);

});

});

//files:name
//get files
app.get('/image/:filename',(req,res)=>{

    gfs.files.findOne({filename: req.params.filename},(err,file)=>{
    
        if(!file || file.length === 0){
            return res.status(404).json({
                err : 'No file Exist'
            });
        }

       // return res.json(file);
       //check image
if(file.contentType=== 'image/jpeg' || file.contentType ==='image/png'){
    const readstream = gfs.createReadStream(file.filename);
    readstream.pipe(res)

}else{
    res.status(404).json({
        err: 'Not image'
    });
}
    


    });
});

app.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
  
      res.redirect('/');
    });
  });


    

app.listen('3000',()=> console.log('server is started at port 3000......'));
