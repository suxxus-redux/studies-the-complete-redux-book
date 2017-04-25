const last = require('lodash.last');
const compose = require('lodash.compose');
const keys = require('lodash.keys');
const createStore = require('redux').createStore;
const combineReducers = require('redux').combineReducers;

const initialState = {
    recipes: {
        1: {
            id: 1,
            name: 'omelette',
            ingredients: [1, 2]
        }
    },
    ingredients: {
        1: {
            id: 1,
            recipe_id: 1,
            name: 'eggs',
            quantity: 2
        },
        2: {
            id: 2,
            recipe_id: 1,
            name: 'milk',
            quantity: 1
        }
    },
    results: [1]
};

// ------------
// constants
// ------------
const ADD_RECIPE = 'add.recipe';
const ADD_INGREDIENT = 'add.ingredient';

// ------------------
// actions creators
// ------------------
const addRecipe = ({ name, id }) => ({
    type: ADD_RECIPE,
    payload: {
        name,
        id
    }
});

const addIngredient = ({ name, id, recipe_id, quantity }) => ({
    type: ADD_INGREDIENT,
    payload: {
        name,
        id,
        recipe_id,
        quantity
    }
});

// ------------
// reducers
// ------------
const results = function idsReducer(state = [], action) {
    const actions = {
        [ADD_RECIPE]: () => state.concat(action.payload.id),
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const recipes = function recipesReducer(state = {}, action) {
    const actions = {
        [ADD_RECIPE]: () => Object.assign({}, state, {
            [action.payload.id]: {
                id: action.payload.id,
                name: action.payload.name,
                ingredients: []
            }
        }),
        [ADD_INGREDIENT]: () => {
            const recipe = state[action.payload.recipe_id];

            recipe.ingredients = recipe.ingredients.concat(action.payload.id);

            return Object.assign({}, state, {
                [action.payload.recipe_id]: recipe
            });

        },
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const ingredients = function ingredientsReducer(state = {}, action) {
    const actions = {
        [ADD_INGREDIENT]: () => Object.assign({}, state, {
            [action.payload.id]: {
                id: action.payload.id,
                recipe_id: action.payload.recipe_id,
                name: action.payload.name,
                quantity: action.payload.quantity
            }
        }),
        DEFAULT: () => state
    };

    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const rootReducer = combineReducers({
    results,
    recipes,
    ingredients
});

// -------------
// store
// -------------
const store = createStore(rootReducer, initialState);

// -------------
// app
// -------------
const inc = value => value + 1;
const getIngredients = () => store.getState().ingredients;
const getResult = () => store.getState().results;

const getRecipeId = compose(
    inc,
    last,
    getResult
);

const getIngredientId = compose(
    inc,
    parseInt,
    last,
    keys,
    getIngredients
);

const createRecipe = ({ name = '', ingredientsList = [] }) => {
    const recipeId = getRecipeId();

    store.dispatch(addRecipe({
        name,
        id: recipeId
    }));

    ingredientsList.forEach(ingredient => {
        const ingredientWithId = Object.assign({}, ingredient, {
            id: getIngredientId(),
            recipe_id: recipeId
        });

        store.dispatch(addIngredient(ingredientWithId));
    });
};

module.exports = {
    createRecipe,
    store
};
