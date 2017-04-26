const {
    createRecipe,
    fetchData,
    getRecipes,
    subscribe
} = require('./recipes-app');

const updateRecipes = () => {
    console.log('updated state: \n', getRecipes(), '\n ==============');
};

// -------------------
// recipes App
// -------------------

const fetchRecipesData = () => {
    fetchData('http://localhost:4000');
};

const createGuacamoleRecipe = () => {
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
};

// subscribe for changes
subscribe(updateRecipes);

module.exports = {
    createGuacamoleRecipe,
    fetchRecipesData
};
