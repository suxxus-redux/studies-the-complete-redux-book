const recipes = require('./recipes-app');

const store = recipes.store;

const updateRecipes = () => {
    console.log('updated state: \n', store.getState().recipes, '\n ==============');
};

const createGuacamoleRecipe = () => {
    recipes.createRecipe({
        name: 'Guacamole',
        ingredientsList: [{
            name: 'advocado',
            quantity: 1
        }, {
            name: 'lemon',
            quantity: '1/2'
        }]
    });
};

// subscribe for changes
store.subscribe(updateRecipes);

module.exports = {
    createGuacamoleRecipe
};
