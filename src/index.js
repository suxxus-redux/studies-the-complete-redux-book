// const simpleCounter = require('./scripts/redux-implementation-simple-counter');
// const simpleCounterRealRedux = require('./scripts/redux-implementation-simple-counter-using-real-redux');
const { setBaseUrl, login, logout, fetchRecipes, createRecipe } = require('./scripts/recipes-book');

/*
module.exports = {
    simpleCounter,
    simpleCounterRealRedux,
    recipesBook
};
*/

// test
(function() {
    setBaseUrl('http://localhost:8080');

    login({
        email: 'joe90@gmail.com',
        password: 'top-secret'
    });

    setTimeout(() => {
        logout();
    }, 2500);

    fetchRecipes();

    // add a recipe
    setTimeout(() => {
        createRecipe({
            name: 'Guacamole',
            ingredientsList: [{
                name: 'advocado',
                quantity: 1
            }, {
                name: 'lemon',
                quantity: '1/2'
            }]
        });
    }, 1000);
}());
