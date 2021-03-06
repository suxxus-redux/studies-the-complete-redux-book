const last = require('lodash.last');
const createSagaMiddleware = require('redux-saga').default;

const eventChannel = require('redux-saga').eventChannel;
const compose = require('lodash.compose');
const keys = require('lodash.keys');

const nodeFetch = require('node-fetch');
const { normalize, schema } = require('normalizr');
const { createStore, combineReducers, applyMiddleware } = require('redux');
const { all, call, cancel, fork, put, take, takeEvery, takeLatest, select } = require('redux-saga/effects');
const io = require('socket.io-client');

// -----------
// helpers
// -----------
const log = console.log.bind(console); // eslint-disable-line no-console

const fetch = (endpoint, options) =>
    nodeFetch(endpoint, options)
    .then(resp => resp.json()
        .then(json => ({ status: resp.status, json }))
    )
    .catch(error => ({ error }));

const inc = value => value + 1;
const secureValue = value => value >= 1 ? value : 0; // eslint-disable-line no-confusing-arrow

// --------------
// data helpler
// --------------
const normalizer = (data = []) => {
    const Ingredients = new schema.Entity('ingredients');
    const Recipes = new schema.Entity('recipes', {
        ingredients: [Ingredients]
    });
    const RecipesSchema = new schema.Array(Recipes);
    const normalizedData = normalize(data.recipes, RecipesSchema);

    return ({
        ingredients: normalizedData.entities.ingredients,
        recipes: normalizedData.entities.recipes,
        result: normalizedData.result
    });
};

// ------------
// types
// ------------
const asyncActionTypes = type => ({
    PENDING: `${type}.pending`,
    SUCCESS: `${type}.success`,
    ERROR: `${type}.error`
});

// actions
const ADD_RECIPE = 'add.recipe';
const ADD_INGREDIENT = 'add.ingredient';

const API = {
    LOGIN: 'api.login',
    LOGOUT: 'api.logout',
    RECIPES: 'api.fetch.recipes'
};
const API_BASE_URL = 'api.baseUrl';
const API_STARTS = 'api.starts';
const API_DONE = 'api.done';
const API_CANCEL_LOGIN = 'api.cancel.login';
const API_CANCEL_LOGOUT = 'api.cancel.logout';
const API_CANCEL_FETCH_RECIPES = 'api.cancel.fetch.recipes';
const API_LOGIN = asyncActionTypes('login');
const API_LOGOUT = asyncActionTypes('logout');
const FETCH_RECIPES = asyncActionTypes('fetch.recipes');

// const OPEN_WS = 'open.ws';
const WS_STATUS = {
    OPEN: 1,
    CLOSED: 2
};

const WS_CONNECTED = 'ws.connected';
const WS_DISCONNECT = 'ws.disconnect';
const WS_DISCONNECTED = 'ws.disconnected';
const WS_MESSAGE = 'ws.message';
const WS_TO_SERVER = 'ws.to.server';
const WS_FROM_SERVER = 'from.server';

const wsMessage = msg => ({
    type: WS_MESSAGE,
    payload: msg
});

const wsDisconnect = () => ({ type: WS_DISCONNECT });

const wsConnected = apiKey => ({ apiKey, type: WS_CONNECTED, payload: WS_STATUS.OPEN });

const wsDisconnected = () => ({ type: WS_DISCONNECTED, payload: WS_STATUS.CLOSED });

const apiCancelFetchRecipes = () => ({ type: API_CANCEL_FETCH_RECIPES });

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

const setApiBaseUrl = baseUrl => ({
    type: API_BASE_URL,
    payload: baseUrl
});

const userLogin = data => ({
    type: API.LOGIN,
    payload: Object.assign({
        endpoint: 'api/login',
        method: 'POST',
        data
    }, API_LOGIN)
});

const userLogout = () => ({
    type: API.LOGOUT,
    payload: Object.assign({
        endpoint: 'api/logout',
        method: 'POST'
    }, API_LOGOUT)
});

const fetchRecipes = () => ({
    type: API.RECIPES,
    payload: Object.assign({
        endpoint: 'api/recipes',
        method: 'GET'
    }, FETCH_RECIPES)
});

const apiStarts = () => ({ type: API_STARTS });
const apiDone = () => ({ type: API_DONE });

// ------------
// sagas
// ------------
const logger = function *() {
    yield takeEvery('*', function *(action) {
        yield log(`ACTION: ${action.type}`);
    });
};

const fetchApiData = onSuccess =>
    function *(action) {
        yield put(apiStarts());
        const { apiKey, apiBaseUrl } = yield select();

        const { status, json, error } = yield call(fetch, `${apiBaseUrl}/${action.payload.endpoint}`, {
            method: action.payload.method,
            body: JSON.stringify(action.payload.data),
            headers: {
                'X-Auth-Token': apiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });

        if (status >= 300) {
            yield put({
                type: action.payload.ERROR,
                payload: ({
                    name: 'response status',
                    message: status
                })
            });
        }

        if (status === 200 && json) {
            yield put({
                type: action.payload.SUCCESS,
                payload: onSuccess(json)
            });
        }

        if (status === 204) {
            yield put({ type: action.payload.SUCCESS });
        }

        if (error) {
            yield put({
                type: action.payload.ERROR,
                payload: error
            });
        }

        yield put(apiDone());
    };

const cancelApiTask = function *(task) {
    yield cancel(task);
    yield put(apiDone());
};

const apiLogin = function *() {
    const loginTask = yield fork(takeEvery, API.LOGIN, fetchApiData(({ apiKey }) => apiKey));

    yield fork(takeLatest, API_CANCEL_LOGIN, cancelApiTask, loginTask);
};

const apiLogout = function *() {
    const logoutTask = yield fork(takeEvery, API.LOGOUT, fetchApiData());

    yield fork(takeLatest, API_CANCEL_LOGOUT, cancelApiTask, logoutTask);
};

const apifetchRecipes = function *() {
    const fetchTask = yield fork(takeEvery, API.RECIPES, fetchApiData(json => normalizer(json.books)));

    yield fork(takeLatest, API_CANCEL_FETCH_RECIPES, cancelApiTask, fetchTask);
};

const connect = wsroot =>
    () => new Promise(resolve => {
        const socket = io(wsroot);

        socket.on('connect', () => {
            resolve(socket);
        });
    });

const disconnect = socket =>
    () => new Promise(resolve => {

        let socketDisconnet = null;

        socket.on('disconnect', () => {
            resolve(socketDisconnet);
        });

        socketDisconnet = socket.disconnect();
    });

const subscribe = socket =>
    eventChannel(emit => {
        socket.on(WS_FROM_SERVER, ({ type, payload }) => {

            const actions = {
                [WS_MESSAGE]: () => emit(wsMessage(payload)),
                [WS_DISCONNECT]: () => emit(wsDisconnect()),
                DEFAULT: () => {}
            };

            const action = actions[type] || actions.DEFAULT;

            action();
        });

        return () => {};
    });

const read = function *(socket) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const channel = yield call(subscribe, socket);
        const action = yield take(channel);

        yield put(action);
    }
};

const write = function *(socket) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { payload } = yield take(WS_TO_SERVER);

        yield socket.emit(WS_TO_SERVER, payload);
    }
};

const onMessage = function *(socket) {
    yield fork(read, socket);
    yield fork(write, socket);
};

const initializeWebSocketCommunication = function *() {

    let socket;

    yield takeLatest(API_LOGIN.SUCCESS, function *() {
        const { apiBaseUrl, apiKey } = yield select();

        socket = yield call(connect(apiBaseUrl));

        yield put(wsConnected());

        yield fork(onMessage, socket);
        yield put({ type: WS_TO_SERVER, payload: wsConnected(apiKey) });
    });

    yield takeLatest([WS_DISCONNECT, API_LOGOUT.SUCCESS], function *() {
        socket = yield call(disconnect(socket));
        yield put(wsDisconnected());
    });

};

const rootSaga = function *() {
    yield all([
        logger(),
        apiLogin(),
        apiLogout(),
        initializeWebSocketCommunication(),
        apifetchRecipes()
    ]);
};

const sagaMiddleware = createSagaMiddleware();

// ------------
// reducers
// ------------

const apiBaseUrl = function apiBaseUrlReducer(state = '', action) {
    if (action.type === API_BASE_URL) {
        return action.payload;
    }

    return state;
};

const apiKey = function apiKeyReducer(state = '', action) {
    const actions = {
        [API_LOGIN.SUCCESS]: () => action.payload,
        [API_LOGOUT.SUCCESS]: () => '',
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const userIsLogged = function userIsLoggedReducer(state = false, action) {
    const actions = {
        [API_LOGIN.SUCCESS]: () => true,
        [API_LOGOUT.SUCCESS]: () => false,
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const result = function idsReducer(state = [], action) {
    const actions = {
        [FETCH_RECIPES.SUCCESS]: () => state.concat(action.payload.result),
        [ADD_RECIPE]: () => state.concat(action.payload.id),
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const recipes = function recipesReducer(state = {}, action) {
    const actions = {
        [FETCH_RECIPES.SUCCESS]: () => Object.assign({}, state, action.payload.recipes),
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
        [FETCH_RECIPES.SUCCESS]: () => action.payload.ingredients,
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

const requests = function uiReducer(state = 0, action) {
    const actions = {
        [API_STARTS]: () => state + 1,
        [API_DONE]: () => state - 1,
        DEFAULT: () => state
    };
    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const requestsError = function fetchErrorsReducer(state = {}, action) {

    const selectAction = ({ name, message }) => ({ name, message });

    const actions = {
        [API_LOGIN.ERROR]: () => selectAction(action.payload),
        [API_LOGIN.SUCCESS]: () => Object.create(null),
        [API_LOGOUT.SUCCESS]: () => Object.create(null),
        [API_LOGOUT.ERROR]: () => selectAction(action.payload),
        [FETCH_RECIPES.SUCCESS]: () => Object.create(null),
        [FETCH_RECIPES.ERROR]: () => selectAction(action.payload),
        DEFAULT: () => state
    };

    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const wsCommunication = function wsCommunicationReducer(state = '', action) {
    const actions = {
        [WS_CONNECTED]: () => action.payload,
        [WS_DISCONNECTED]: () => action.payload,
        [WS_MESSAGE]: () => action.payload,
        DEFAULT: () => state
    };

    const doAction = actions[action.type] || actions.DEFAULT;

    return doAction();
};

const rootReducer = combineReducers({
    apiKey,
    apiBaseUrl,
    userIsLogged,
    result,
    recipes,
    requests,
    requestsError,
    ingredients,
    wsCommunication
});

// -------------
// store
// -------------
const store = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware)
);

const getIngredients = () => store.getState().ingredients;
const getResult = () => store.getState().result;


// ----------------
// recipe creator
// ----------------

const getRecipeId = compose(
    inc,
    secureValue,
    last,
    getResult
);

const getIngredientId = compose(
    inc,
    secureValue,
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

sagaMiddleware.run(rootSaga);

// ------------------------------
module.exports = {
    createRecipe,
    getIngredients,
    setBaseUrl: baseUrl => store.dispatch(setApiBaseUrl(baseUrl)),
    login: data => store.dispatch(userLogin(data)),
    logout: () => store.dispatch(userLogout()),
    fetchRecipesData: baseUrl => store.dispatch(fetchRecipes(baseUrl)),
    cancelFetchRecipes: () => store.dispatch(apiCancelFetchRecipes()),
    getState: () => Object.assign({}, store.getState()),
    subscribe: fn => store.subscribe(fn)
};
