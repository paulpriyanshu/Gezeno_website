const mongoose = require('mongoose');

// Parent Category Schema
const parentCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  image: { type: String, required: false },
  subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: false,default:[] }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ParentCategory = mongoose.model('ParentCategory', parentCategorySchema);

// Subcategory Schema
const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  image: { type: String, required: false },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentCategory', required: true },
  subSubCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubSubCategory', required: false }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

// Sub-Subcategory Schema
const subSubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  image: { type: String, required: false },
  parentSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
  subSubSubCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubSubSubCategory', required: false }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
 
const SubSubCategory = mongoose.model('SubSubCategory', subSubCategorySchema);

// Sub-Sub-Subcategory Schema
const subSubSubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  image: { type: String, required: false },
  parentSubSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubSubCategory', required: true },
  subSubSubSubCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubSubSubSubCategory', required: false }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SubSubSubCategory = mongoose.model('SubSubSubCategory', subSubSubCategorySchema);

// Sub-Sub-Sub-Subcategory Schema
const subSubSubSubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  image: { type: String, required: false },
  parentSubSubSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubSubSubCategory', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SubSubSubSubCategory = mongoose.model('SubSubSubSubCategory', subSubSubSubCategorySchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  shortDetails:{
    type:String,
    required:[false,"Please enter product short detail"]
},
description: {
    type: String,
    required: [false, "Please enter product description"],
},
productSpecs: {
    type: String,
    required: [false, "Please enter product specification"],
},
ratings: {
    type: Number,
    default: 0,
},
metatitle:{
    type: String,
    required:[false]
},
metakeyword:{
    type: String,
    required:[false]
}, 
 metadescription:{
    type: String,
    required:[false]
},
 metascript:{
    type: String,
    required:[false]
},
  price: { type: Number, required: true },
  discountedPrice: { type: Number, required: false },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentCategory', required: false },
  subCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: false }],
  subSubCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubSubCategory', required: false }],
  subSubSubCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubSubSubCategory', required: false }],
  subSubSubSubCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubSubSubSubCategory', required: false }],
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: false },
  variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant',required:false }],
  images: [
    {
      url: { type: String, required: true },
      filename: { type: String, required: true }
    }
  ],
  rating: { type: Number, default: 0 },
  numOfReviews: { type: Number, default: 0 },
  filters: 
    {
      filter: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Filter', 
        required: false 
      }, // Reference to the filter (e.g., "Color")
      tags: { 
        type: [String], 
        required: true 
      } // Tags selected from the filter (e.g., ["Red", "Blue"])
    }
  ,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  reviews: [
    {
      user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  stock: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const productVariantSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    color: { type: String, required: false },
    variantName: { type: String, required: true },
    commingSoon: { type: Boolean, default: false },
    variantPrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    sizes: {
        type: [String],
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '26', '28', '30'],
        default: []
    },
    images: [
        {
            url: { type: String, required: false },
            filename: { type: String, required: false }
        }
    ],
    
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    availableStock: { type: Number, default: 0 }, // New field for available stock
    maxQtyPerOrder: { type: Number, default: 5 }, // New field for max quantity per order
    customFields: { type: Map, of: String }, // Optional custom fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const filterSchema = new mongoose.Schema({
  name: { type: String, required: true},
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Filter = mongoose.model('Filter', filterSchema);

module.exports = Filter;

const ProductVariant=mongoose.model('ProductVariant', productVariantSchema);
// Brand Schema
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Brand = mongoose.model('Brand', brandSchema);

// Home Schema
const carouselSchema = new mongoose.Schema(
  {
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'categoryType' // Dynamically reference based on `categoryType` field
    },
    categoryType: { 
      type: String, 
      required: true, 
      enum: ['ParentCategory', 'SubCategory', 'SubSubCategory','SubSubSubCategory'] // Allowed schemas
    }
  }, 
  { timestamps: true }
);
  
const Carousel = mongoose.model('Carousel', carouselSchema);

const secondarycarouselSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentCategory', required: true }
  }, { timestamps: true });
  
const SecondaryCarousel = mongoose.model('SecondaryCarousel', secondarycarouselSchema);

const thirdcarouselSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentCategory', required: true }
  }, { timestamps: true });
  
const ThirdCarousel = mongoose.model('ThirdCarousel', thirdcarouselSchema);

const fourthcarouselSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentCategory', required: true }
  }, { timestamps: true });
  
const FourthCarousel = mongoose.model('FourthCarousel', fourthcarouselSchema);

  const bannerSchema = new mongoose.Schema({
    url: { type: String, required: true },
    redirectUrl: {type:String,required:false}
  }, { timestamps: true });
const Banner = mongoose.model('Banner', bannerSchema);
  
const customSectionSchema = new mongoose.Schema(
  {
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'categoryType' // Dynamically reference based on `categoryType` field
    },
    categoryType: { 
      type: String, 
      required: true, 
      enum: ['ParentCategory', 'SubCategory', 'SubSubCategory','SubSubSubCategory','SubSubSubSubCategory'] // Allowed schemas
    }
  }, 
  { timestamps: true }
);
  
  const CustomSection = mongoose.model('CustomSection', customSectionSchema);

const ourbestpicks = new mongoose.Schema(
  {
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'categoryType' // Dynamically reference based on `categoryType` field
    },
    categoryType: { 
      type: String, 
      required: true, 
      enum: ['ParentCategory', 'SubCategory', 'SubSubCategory','SubSubSubCategory','SubSubSubSubCategory'] // Allowed schemas
    }
  }, 
  { timestamps: true }
);
  
const OurBestPicks = mongoose.model('OurBestPicks', ourbestpicks);


const toohottobemissed = new mongoose.Schema( {
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    refPath: 'categoryType' // Dynamically reference based on `categoryType` field
  },
  categoryType: { 
    type: String, 
    required: true, 
    enum: ['ParentCategory', 'SubCategory', 'SubSubCategory','SubSubSubCategory','SubSubSubSubCategory'] // Allowed schemas
  }
}, 
{ timestamps: true });
  
const TooHotToBeMissed = mongoose.model('ToHotToBeMissed', toohottobemissed);

const gezenooriginals = new mongoose.Schema( {
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    refPath: 'categoryType' // Dynamically reference based on `categoryType` field
  },
  categoryType: { 
    type: String, 
    required: true, 
    enum: ['ParentCategory', 'SubCategory', 'SubSubCategory','SubSubSubCategory','SubSubSubSubCategory'] // Allowed schemas
  }
}, 
{ timestamps: true });
  
const GezenoOriginals = mongoose.model('GezenoOriginals', gezenooriginals);

const widgets = new mongoose.Schema( {
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    refPath: 'categoryType' // Dynamically reference based on `categoryType` field
  },
  categoryType: { 
    type: String, 
    required: true, 
    enum: ['ParentCategory', 'SubCategory', 'SubSubCategory','SubSubSubCategory','SubSubSubSubCategory'] // Allowed schemas
  }
}, 
{ timestamps: true });
  
const Widgets = mongoose.model('Widgets', widgets);

const headerSchema = new mongoose.Schema({
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ParentCategory',  
      required: true 
    }
  }, { timestamps: true });
  
const Header = mongoose.model('Header', headerSchema);
  
const subMenu = new mongoose.Schema(
  {
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'categoryType' // Dynamically reference based on `categoryType` field
    },
    categoryType: { 
      type: String, 
      required: true, 
      enum: ['ParentCategory', 'SubCategory', 'SubSubCategory','SubSubSubCategory','SubSubSubSubCategory'] // Allowed schemas
    }
  }, 
  { timestamps: true }
);
  
const SubMenu = mongoose.model('SubMenu', subMenu);


module.exports = {
  ParentCategory,
  SubCategory,
  SubSubCategory,
  SubSubSubCategory,
  SubSubSubSubCategory,
  Product, 
  Brand,
  ProductVariant,
  CustomSection,
  Banner,
  Carousel,
  Header,
  SecondaryCarousel,
  ThirdCarousel,
  FourthCarousel,
  OurBestPicks,
  TooHotToBeMissed,
  GezenoOriginals,
  Widgets,
  Filter,
  SubMenu

};