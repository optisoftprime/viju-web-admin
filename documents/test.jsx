// // create this endpoint to post loading request for a customer, this is the request body:
// {
//   "warehouseName": "LAGOS WAREHOUSE", // enum of type "LAGOS WAREHOUSE" | "OGUN WAREHOUSE" | "ABUJA WAREHOUSE"
//   "truckPlateNumber": "LAG-234-XY", // the customer input this
//   "driverName": "Jimoh Ibrahim", // the customer input this
//   "driverPhone": "+2348012345678", // the customer input this
//   "loadingCapacity": 1200, // the customer input this
// "orders": {
//     "order-01819": [
//     {
//       "productId": "product-uuid-1", // the frontend will send this, it represents the product name is from the raw_sales_order -> ITEM_DESCRIPTION
//       "productName": "Product A", // the frontend will send this, it represents the product name is from the raw_sales_order -> ITEM_DESCRIPTION
//       "quantity": 120, // the frontend will send this
//       "weightPerCarton": 25, // the frontend will send this, it represents the product name is from the raw_sales_order -> ITEM_DESCRIPTION
//     },
//     {
//       "productId": "product-uuid-2",
//       "productName": "Product B",
//       "quantity": 80,
//       "weightPerCarton": 25,
//     }
  
//     ], 
//     "order-0q9020819": [
//     {
//       "productId": "product-uuid-4", // the frontend will send this, it represents the product name is from the raw_sales_order -> ITEM_DESCRIPTION
//       "productName": "Product A", // the frontend will send this, it represents the product name is from the raw_sales_order -> ITEM_DESCRIPTION
//       "quantity": 10, // the frontend will send this
//       "weightPerCarton": 20, // the frontend will send this, it represents the product name is from the raw_sales_order -> ITEM_DESCRIPTION
//     },
//     {
//       "productId": "product-uuid-5",
//       "productName": "Product B",
//       "quantity": 90,
//       "weightPerCarton": 18,
//     }
  
//     ], 

// },

//   "linkedPurchaseId": "purchase-uuid", // linkedPurchaseId is from the raw_sales_order
//   "requestedLoadingDate": "2026-08-30" // the customer selected this
// }

// // linkedPurchaseId is from the raw_sales_order
// // the products array items are from the raw_sales_order record linked to the linkedPurchaseId the customer selected.

// // customer id is raw_sales_order -> INVOICE_CUSTOMER_ID
// // for each customer raw_sales_order return an array of objects containing these
// // create an endpoint these response (the endpoint should get the customer id as the req params):
// [
//     {
//       "productId": "product-uuid-1",  // value gotten from mapping the raw_sales_order -> ITEM_DESCRIPTION to the product name on viju_product_specifiaction.md file
//       "productName": "Product A", // the product name is from the raw_sales_order -> ITEM_DESCRIPTION
//       "weightPerCarton": 25, // value gotten from mapping the raw_sales_order -> ITEM_DESCRIPTION to the product name on viju_product_specifiaction.md file
//     },
//     {
//       "productId": "product-uuid-1",  // value gotten from mapping the raw_sales_order -> ITEM_DESCRIPTION to the product name on viju_product_specifiaction.md file
//       "productName": "Product A", // the product name is from the raw_sales_order -> ITEM_DESCRIPTION
//       "weightPerCarton": 25, // value gotten from mapping the raw_sales_order -> ITEM_DESCRIPTION to the product name on viju_product_specifiaction.md file
//     },

//   ]





{
  "warehouseName": "LAGOS WAREHOUSE",
  "truckPlateNumber": "LAG-234-XY",
  "driverName": "Jimoh Ibrahim",
  "driverPhone": "+2348012345678",
  "loadingCapacity": 1200,
  "orders": {
    "f7a86c0a-1ee9-40d0-85a0-5334f6da100c": [
      { "productId": "101020104", "productName": "Mr V Premium Table Water(Lagos)", "quantity": 120, "weightPerCarton": 9.38 },
      { "productId": "101060111", "productName": "V-COOL COFFEE(Abuja)", "quantity": 80, "weightPerCarton": 6.33 }
    ],
    "a7a86c0a-1ee9-40d0-85a0-5334f6da100c": [
      { "productId": "101011701", "productName": "VSMARTIC WHEAT FLAVOURED MILK", "quantity": 10, "weightPerCarton": 11.6 }
    ]
  },
  "linkedPurchaseId": ["f7a86c0a-1ee9-40d0-85a0-5334f6da100c", "a7a86c0a-1ee9-40d0-85a0-5334f6da100c"],
  "requestedLoadingDate": "2026-09-05"
}
