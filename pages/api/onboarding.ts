var SibApiV3Sdk = require("sib-api-v3-sdk");
var defaultClient = SibApiV3Sdk.ApiClient.instance;

var apiKey = defaultClient.authentications[""];
apiKey.apiKey = "";
var apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
var emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign();

emailCampaigns.name = "Campaign sent via the API";
emailCampaigns.subject = "My subject";
emailCampaigns.sender = {
  name: "From name",
  email: "myfromemail@mycompany.com",
};
emailCampaigns.type = "classic";

const htmlContent =
  "Congratulations! You successfully sent this example campaign via the Brevo API.";

const recipients = { listIds: [2, 7] };

const scheduledAt = "2018-01-01 00:00:01";

apiInstance.createEmailCampaign(emailCampaigns).then(
  function (data) {
    console.log(data);
  },
  function (error) {
    console.error(error);
  },
);
