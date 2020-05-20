javascript
  var handleSubmission = function(e) {
    e.preventDefault();
    var entryValue = entryContentElement.val()
    if (entryValue.length > 0) {
      entryValue += " " + new Date();     // ADD THIS LINE
      entriesElement.append("<p>...</p>");
      $.getJSON("rpush/guestbook/" + entryValue, appendGuestbookEntries);
      entryContentElement.val("")
    }
    return false;
  }
