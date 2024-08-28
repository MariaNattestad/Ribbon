import { EXAMPLE_SESSIONS } from "./constants";
import { CLI } from "./file_parsing";
import { read_bam_urls, go_to_ribbon_mode, user_message_ribbon } from "./index_ribbon";
import {
  _splitthreader_static,
  load_bedpe_from_url,
  load_vcf_from_urls,
  show_visualizer_tab,
  use_annotation_at_index,
  use_coverage,
  go_to_splitthreader_mode,
  user_message_splitthreader,
} from "./index_splitthreader";
import * as d3 from "d3";

async function load_session_json(session) {

  d3.select("#json_session_input").property("value", JSON.stringify(session, null, 2));

  let skip_vcf = false;
  if (session.bedpe && session.vcf) {
    // This applies to both SplitThreader and Ribbon:
    user_message_splitthreader("Warning", "Both BEDPE and VCF are found in the session file. Only the BEDPE will be loaded.");
    user_message_ribbon(
      "Warning",
      "Both BEDPE and VCF are found in the session file. Only the BEDPE will be loaded."
    );
    console.warn("Both BEDPE and VCF are found in the session file. Only the BEDPE will be loaded.");
    skip_vcf = true;
  }

  if (session.vcf && !skip_vcf) {
    console.log("Loading VCFs:", session.vcf);
    load_vcf_from_urls(session.vcf);
  }

  if (session.bedpe) {
    console.log("Loading BEDPE:", session.bedpe);
    load_bedpe_from_url(session.bedpe);
  }

  // Load genomic files
  if (session.annotation_id) {
    const index = _splitthreader_static.annotations_available.findIndex((d) => d.id == session.annotation_id);
    use_annotation_at_index(index);
  }

  if (session.bam) {
    console.log("Loading BAMs:", session.bam);
    read_bam_urls(session.bam);
  }


  if (session.coverage) {
    console.log("Loading coverage:", session.coverage);
    const raw_text = await fetch(session.coverage).then(d => d.text());
    use_coverage(raw_text);
  }

  show_visualizer_tab();
}

// Load session from URL
async function load_session_in_url() {
  const url = new URL(window.location.href);
  const session_url = url.searchParams.get("session");
  if(!session_url) return;

  // Load session JSON
  let session;
  if (session_url.startsWith('example:')) {
    const example_name = session_url.split(':')[1];
    const example_id = EXAMPLE_SESSIONS.findIndex((d) => d.name == example_name);
    if (example_id == -1) {
      user_message_splitthreader("Error", "Failed to load example session found in URL. Please choose an example from the list in Splithreader -> Setup -> Examples");
      return;
    }
    session = EXAMPLE_SESSIONS[example_id];
  } else if(session_url.startsWith("https://")) {
    session = await fetch(session_url).then(d => d.json());
  } else {
    alert("Only support sessions from https URLs");
    return;
  }

  await load_session_json(session);
}

// Check for session to load once Aioli is ready
function check_for_session() {
  if (typeof CLI !== 'undefined') {
    load_session_in_url();
  } else {
    console.log("Waiting for Aioli...")
    setTimeout(check_for_session, 1000);
  }
}

d3.select("#go_to_ribbon_mode").on("click", function () {
  go_to_ribbon_mode();
  window.location.hash = "#ribbon";
});

d3.select("#go_to_examples_mode").on("click", function () {
  window.location.hash = "#examples";
});

d3.select("#go_to_about_mode").on("click", function () {
  window.location.hash = "#about";
});

d3.select("#go_to_splitthreader_mode").on("click", function () {
  go_to_splitthreader_mode();
  // Set hash to #splitthreader:
  window.location.hash = "#splitthreader";
});

function check_url_for_mode() {
  const hash = window.location.hash;
  // These are now tabs in the UI, so clicking them is the easiest
  // way to switch tabs without buggy behavior.
  if (!hash) {
    return;
  }
  if (hash === "#splitthreader") {
    document.getElementById("go_to_splitthreader_mode").click()
  } else if (hash === "#ribbon") {
    document.getElementById("go_to_ribbon_mode").click()
  } else if (hash === "#about") {
    document.getElementById("go_to_about_mode").click()
  } else {
    console.error("unknown hash in URL:", hash);
  }
}

// Add event listener for hash change
window.addEventListener("hashchange", check_url_for_mode);

// Call check_url_for_mode on page load
check_url_for_mode();

// Initialize
check_for_session();

function list_example_sessions() {
  d3.select("#example_sessions")
    .append("ul")
    .selectAll("li")
    .data(EXAMPLE_SESSIONS)
    .enter()
    .append("li")
    .append("a")
    .text(function (d) {
      return d.description;
    })
    .attr("href", function (d) {
      return `?session=example:${d.name}#splitthreader`;
    });
}

list_example_sessions();
