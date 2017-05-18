// const simpleCounter = require('./scripts/redux-implementation-simple-counter');
// const simpleCounterRealRedux = require('./scripts/redux-implementation-simple-counter-using-real-redux');
const recipesBook = require('./scripts/recipes-book');

/*
module.exports = {
    simpleCounter,
    simpleCounterRealRedux,
    recipesBook
};
*/

// test
(function() {
    recipesBook.setApiKey('fa8426a0-8eaf-4d22-8e13-7c1b16a9370c');

    // recipesBook.openWS('http://localhost:8080'); // open websocket
    recipesBook.fetchRecipes('http://localhost:8080');

    // setTimeout(() => recipesBook.closeWS(), 500);

    // add a recipe
    setTimeout(() => {
        recipesBook.createRecipe({
            name: 'Guacamole',
            ingredientsList: [{
                name: 'advocado',
                quantity: 1
            }, {
                name: 'lemon',
                quantity: '1/2'
            }]
        });
    }, 5000);
}());
