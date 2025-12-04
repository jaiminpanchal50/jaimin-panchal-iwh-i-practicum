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
    const contacts = 'https://api.hubapi.com/crm/v3/objects/2-221898858?properties=bike_name&properties=bike_brand&properties=bike_price&associations=contacts';
    const headers = {
        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try {
        const resp = await axios.get(contacts, { headers });
        const customObjects = resp.data.results;

        // Enrich each custom object with contact data
        const enrichedData = await Promise.all(
            customObjects.map(async (ele) => {
                const contactData = [];

                if (ele?.associations?.contacts?.results) {
                    for (const item of ele.associations.contacts.results) {
                        try {
                            const response = await axios.get(
                                `https://api.hubapi.com/crm/v3/objects/contacts/${item.id}`,
                                { headers }
                            );
                            // console.log('Contact Response:', response.data);
                            contactData.push(response.data);
                        } catch (error) {
                            console.error(`Error fetching contact ${item.id}:`, error.response?.data || error.message);
                            contactData.push({ id: item.id, error: 'Failed to fetch' });
                        }
                    }
                }

                return {
                    ...ele,
                    associatedContacts: contactData
                };
            })
        );


        console.log('Enriched Data:', enrichedData);
        res.render('homepage', { data: enrichedData });
    } catch (error) {
        console.error('Main API error:', error);
        res.status(500).send('Error fetching data');
    }
});



// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.


app.get('/update-cobj', async (req, res) => {
    res.render('updates', { title: 'Update Custom Object Form | Integrating With HubSpot I Practicum' });
});

// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.

app.post('/update-cobj', async (req, res) => {
    const { firstname, lastname, email, bike_name, bike_brand, bike_price } = req.body;
    // console.log('form data', email);

    try {
        let contactId = null;
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
            contactId = data[0].id;
            res.status(200).send('Contact with this email already exists');
        } else {
            // create new contact record
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

            // console.log('New contact created:', response.data);
            contactId = response.data.id;
            // console.log('New contact created with ID:', contactId);


            // Create custom object data
            const addBike = await axios.post(
                'https://api.hubapi.com/crm/v3/objects/2-221898858',
                {
                    "properties": { bike_name, bike_brand, bike_price }
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
                        'Content-Type': 'application/json'
                    }
                },
            );

            const bikeID = addBike.data.id;
            // console.log('New Bike created with ID:', bikeID);


            // association code 

            await axios.put(
                `https://api.hubapi.com/crm/v4/objects/2-221898858/${bikeID}/associations/default/contacts/${contactId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS}`,
                        'Content-Type': 'application/json'
                    }
                },
            );

            // console.log(`Bike with ID ${bikeID} associated with Contact ID ${contactId}`);
            res.redirect('/');
        }

    } catch (error) {
        console.error('Error creating or updating contact:', error);
    }

});






// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));