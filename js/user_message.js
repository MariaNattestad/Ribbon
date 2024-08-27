import * as d3 from "d3";

export function user_message(message_type, message, element_id) {
  var message_style = "default";
  switch (message_type) {
    case "Permalink":
      html =
        "<strong>" +
        message_type +
        ': </strong><a href="' +
        message +
        '" target="_blank">' +
        message +
        "</a> <p>Permalinks recreate the current view with all the data and settings except that it only takes the current snapshot of a bam file instead of copying the whole thing.<p>";
      message_style = "success";
      break;
    case "error":
      message_style = "danger";
      break;
    case "Error":
      message_style = "danger";
      break;
    case ("warning", "Warning"):
      message_style = "warning";
      break;
    case "Instructions":
      message_style = "info";
      break;
    case "Success":
      message_style = "success";
      break;
    default:
      message_style = "info";
  }
  let html = "<strong>" + message_type + ": </strong>" + message;

  var alert = d3
    .select(element_id)
    .append("div")
    .attr("class", "alert alert-" + message_style + " alert-dismissable")
    .attr("role", "alert");
  alert
    .append("a")
    .attr("href", "#")
    .attr("class", "close")
    .attr("data-dismiss", "alert")
    .attr("aria-label", "close")
    .html("&times;");
  alert.append("p").html(html);
}
