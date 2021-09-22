const {Product}=require('../models/product')
const express=require('express')
const { Category } = require('../models/category')
const router=express.Router()
const mongoose=require('mongoose')
const multer=require('multer')





const FILE_TYPE_MAP={
    'image/png':'png',
    'image/jpeg':'jpeg',
    'image/jpg':'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid=FILE_TYPE_MAP[file.mimetype]
        let uploadError=new Error('invalid image type')
        if(isValid){
            uploadError=null
        }
      cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
     const fileName=file.originalname.split(' ').join('-')
     const extension=FILE_TYPE_MAP[file.mimetype]   
     // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })
  
  const uploadOptions = multer({ storage: storage })


router.get(`/`,async(req,res)=>{
//to filter products on basis of categories //products?categories=....

    let filter={}
    if(req.query.categories){
        filter={category:req.query.categories.split(',')}
    }
    const productList=await Product.find(filter)

    if(!productList){
        res.status(500).json({success:false})
    }
    res.send(productList)
})

router.get(`/:id`,async(req,res)=>{
    //to show fields from another table
   // const product=await Product.findById(req.params.id).populate('category')
    const product=await Product.findById(req.params.id)
    if(!product){
        res.status(500).json({success:false})
    }
    res.send(product)
})

router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);

    if (!productCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        productCount: productCount,
    });
});




// router.get(`/get/count`,async(req,res)=>{
//     //to get total number of products in products tble
//     const productCount=await Product.countDocuments((count)=>count)
//    // const product=await Product.findById(req.params.id)
//     if(!productCount){
//       return  res.status(500).json({success:false})
//     }
//     res.send({productCount:productCount})
// })

router.get(`/get/featured/:count`,async(req,res)=>{
    const count=req.params.count? req.params.count:0
    //to get specific products to certain limit
    const products=await Product.find({isFeatured:true}).limit(+count)
   // const product=await Product.findById(req.params.id)
    if(!products){
      return  res.status(500).json({success:false})
    }
    res.send(products)
})



router.put('/:id',async(req,res)=>{
if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).send('invalid id')
}
    const category=await Category.findById(req.body.category)

    if(!category)return res.status(400).send('invalid category')

    const product = await Product.findByIdAndUpdate(req.params.id,
        {
            name:req.body.name,
            description:req.body.description,
            richDescription:req.body.richDescription,
            image:req.body.image,
            images:req.body.images,
            brand:req.body.brand,
            price:req.body.price,
            category:req.body.category,
            countInStock:req.body.countInStock,
            rating:req.body.rating,
            numReviews:req.body.numReviews,
            isFeatured:req.body.isFeatured,
            dateCreated:req.body.dateCreated,
              
        },{new:true})
        if(!product) {
            return  res.status(404).send('product cannot be updated.')
         }
    res.send(product)
    

    })


router.post(`/`,uploadOptions.single('image') ,async (req,res)=>{
    const category=await Category.findById(req.body.category)

    if(!category)return res.status(400).send('invalid category')
    
//to check if there is file to be uploaded or not 
const file=req.file
if(!file)return res.status(400).send('no image in request...')
    
    //after renaming image make complete url
const fileName=req.file.filename

const basePath=`${req.protocol}://${req.get('host')}/public/uploads/`

const productDes= new Product({
    name:req.body.name,
    description:req.body.description,
    richDescription:req.body.richDescription,
    image:`${basePath}${fileName}`,////http://localhost:3000/public/upload/image-234333 ...for making this
    images:req.body.images,
    brand:req.body.brand,
    price:req.body.price,
    category:req.body.category,
    countInStock:req.body.countInStock,
    rating:req.body.rating,
    numReviews:req.body.numReviews,
    isFeatured:req.body.isFeatured,
    dateCreated:req.body.dateCreated,

})
product=await productDes.save()
if(!product){
 return   res.status(500).send('product cannot be created..')
}
res.send(product)

})


router.delete('/:id',(req,res)=>{
    Product.findByIdAndRemove(req.params.id).then((product)=>{
if(product){
    return res.status(200).json({
        success:true,
        message:'the product has been deleted...'
    })
}else{
    res.status(404).json({
        success:false,message:'product not found..'
    })
}
    }).catch(err=>{
        res.status(400).json({
            success:false,
            error:err
        })
    })
})

// router.put('/gallery-images/:id' ,uploadOptions.array('images',10),async(req,res)=>{

//     if(!mongoose.isValidObjectId(req.params.id)){
//         return res.status(400).send('invalid id')
//     }
//     let imagePaths=[]
//     const files=req.files
//     const basePath=`${req.protocol}://${req.get('host')}/public/uploads/`
// if(files){
//     files.map(file=>{
//         imagePaths.push(`${basePath}${file.fileName}`)
//     })
// }

//         const product = await Product.findByIdAndUpdate(req.params.id,
//             {
//                 images:imagePaths                  
//             },{new:true})
//             if(!product) {
//                 return  res.status(404).send('product cannot be updated.')
//              }
//         res.send(product)
        
    

// })


router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id');
        }
        const files = req.files;
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        if (files) {
            files.map((file) => {
                imagesPaths.push(`${basePath}${file.filename}`);
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths,
            },
            { new: true }
        );

        if (!product)
            return res.status(500).send('the gallery cannot be updated!');

        res.send(product);
    }
);



module.exports=router