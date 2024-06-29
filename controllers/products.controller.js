import ErrorModel from '../models/Error.model.js'
import Product from '../models/Product.model.js'

const getProducts = async (req, res, next) => {   
    try {
        const products = await Product.find().sort({ updated: -1 })
        if(products) return res.status(200).json(products)
    } catch(err) {
        return next(new ErrorModel(err))
    }
}

const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
        if(!product) return next(new ErrorModel('Error al obtener el producto'))
        return res.status(200).json(product)
    } catch(err) {
        return next(new ErrorModel(err))
    }
}

export {
    getProducts,
    getProduct
}