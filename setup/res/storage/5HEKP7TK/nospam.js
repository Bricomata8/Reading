function noSpam(user,domain) {
  locationstring = "mailto:" + user + "@" + domain;
  window.location = locationstring;
}

function showEmail(user,domain) {
  window.alert("E-mail: " + user + "@" + domain);
}
