import { NextApiRequest, NextApiResponse } from "next";
const SibApiV3Sdk = require("@getbrevo/brevo");

export default function onboardUser(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  let apiInstance = new SibApiV3Sdk.ContactsApi();
  let createContact = new SibApiV3Sdk.CreateContact();
  let userEmail = request.body.email;
  const listId = 37;

  let apiKey = apiInstance.authentications["apiKey"];
  apiKey.apiKey = process.env.NEXT_PUBLIC_BREVO_API;

  createContact.email = request.body.email;
  //change this value to match onboarding list id
  createContact.listIds = [listId];

  let contactEmails = new SibApiV3Sdk.AddContactToList();
  contactEmails.emails = [request.body.email];

  //check if contact exists
  apiInstance.getContactInfo(userEmail).then(
    function (data) {
      //if contact exists, add to list
      console.log(data);
      if (data.body.email) {
        apiInstance.addContactToList(listId, contactEmails).then(
          function () {
            response
              .status(200)
              .json({ success: true, message: "Contact added" });
          },
          function (error) {
            //if already exists then ignore
            console.log(error);
            if (error.statusCode === 400) {
              response
                .status(400)
                .json({ success: false, message: "Contact exists" });
            }
          },
        );
      }
    },
    //if contact doesnt exists then create one and add to list
    function (error) {
      if (error.statusCode === 404) {
        apiInstance.createContact(createContact).then(
          function (data) {
            response.status(200).json({
              success: true,
              message: "Contact created and added to list",
            });
          },
          function (error) {
            response
              .status(400)
              .json({ success: true, message: "Error creating contact" });
          },
        );
      }
      response
        .status(400)
        .json({ success: true, message: "Error creating contact" });
    },
  );
}
