const {
    createRecipe,
    fetchData,
    getState,
    setApiKey,
    subscribe
} = require('./recipes-app');

const log = console.log.bind(console); /* eslint no-console:"off" */

const updateRecipes = () => {
    log('state --> \n', getState(), '\n ==============');
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
    setApiKey,
    fetchRecipesData,
    createGuacamoleRecipe
};
