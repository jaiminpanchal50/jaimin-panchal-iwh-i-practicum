const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config();
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.

app.get('/', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        // console.log(data);
        res.render('homepage', { title: 'Contacts | HubSpot APIs', data });
    } catch (error) {
        console.error(error);
    }
});


// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.


app.get('/update-cobj', async (req, res) => {
    res.render('updates', { title: 'Update Custom Object Form | Integrating With HubSpot I Practicum' });
});

// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.

app.post('/update-cobj', async (req, res) => {
    const { firstname, lastname, email } = req.body;
    console.log('form data', email);

    try {
        const response = await axios.post(
            'https://api.hubapi.com/crm/v3/objects/contacts/search',
            { "filterGroups": [{ "filters": [{ "operator": "EQ", "propertyName": "email", "value": email }] }] },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            },
        );
        const data = await response.data.results;
        // console.log(data);
        if (data.length > 0) {
            res.status(200).send('Contact with this email already exists. No new contact created.');
            console.log('Contact exists:',);
        } else {
            const response = await axios.post(
                'https://api.hubapi.com/crm/v3/objects/contacts',
                {
                    "properties": { firstname, lastname, email }
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
                        'Content-Type': 'application/json'
                    }
                },
            );

            console.log('New contact created:', response.data);
            res.redirect('/');
        }

    } catch (error) {
        console.error('Error creating or updating contact:', error);
    }

});






// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));