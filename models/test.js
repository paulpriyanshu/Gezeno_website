const mongoose = require('mongoose');
const { Category, SubCategory, SubSubCategory, Product } = require('./product');

async function validateCategoryRelationships() {
    try {
        // Create test data
        const category = await Category.create({
            name: 'Clothing',
            isActive: true
        });

        const subCategory = await SubCategory.create({
            name: 'Mens',
            isActive: true
        });

        const subSubCategory = await SubSubCategory.create({
            name: 'T-Shirts',
            isActive: true
        });

        // Update relationships
        category.subCategories.push(subCategory._id);
        await category.save();

        subCategory.subSubCategories.push(subSubCategory._id);
        await subCategory.save();

        // Create a product with full category hierarchy
        const product = await Product.create({
            name: 'Cotton T-Shirt',
            price: 29.99,
            shortDetails: 'Comfortable cotton t-shirt',
            description: 'High-quality 100% cotton t-shirt',
            stock: 100,
            category: category._id,
            subCategory: subCategory._id,
            subSubCategory: subSubCategory._id,
            brand: '65f1234567890', // Replace with actual brand ID
            images: [{
                url: 'http://example.com/image.jpg',
                filename: 'image.jpg'
            }]
        });

        // Test fetching product with populated categories
        const populatedProduct = await Product.findById(product._id)
            .populate('category')
            .populate('subCategory')
            .populate('subSubCategory');

        //console.log('Product category hierarchy:', {
            category: populatedProduct.category.name,
            subCategory: populatedProduct.subCategory.name,
            subSubCategory: populatedProduct.subSubCategory.name
        });

    } catch (error) {
        console.error('Validation failed:', error);
    }
}
