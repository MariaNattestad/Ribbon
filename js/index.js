import { EXAMPLE_SESSIONS } from "./constants";
import { CLI } from "./file_parsing";
import { _splitthreader_static, load_vcf_from_url, show_visualizer_tab, use_annotation_at_index, user_message_splitthreader } from "./index_splitthreader";

function load_session_if_present_in_url() {
  if (typeof CLI !== 'undefined') {
    load_session_from_url();
  } else {
    console.log("Waiting for Aioli...")
    setTimeout(load_session_if_present_in_url, 1000);
  }
}

function load_session_from_url() {
  let url = new URL(window.location.href);
  let session = url.searchParams.get("session");
  if (session) {
    if (session.startsWith('example:')) {
      let example_name = session.split(':')[1];
      let example_id = EXAMPLE_SESSIONS.findIndex((d) => d.name == example_name);
      if (example_id == -1) {
        user_message_splitthreader("Error", "Failed to load example session found in URL. Please choose an example from the list in Splithreader -> Setup -> Examples");
        return;
      }
      let session_json = EXAMPLE_SESSIONS[example_id];
      load_session(session_json);
    } else {
      // Assume session is a URL.
      // TODO: Read session from a URL -- need an example for this. For now, testing with example sessions.
    }
  }
}

function load_session(session) {
  console.log("Loading session with JSON:", session);
  if (session.annotation_id) {
    const index = _splitthreader_static.annotations_available.findIndex((d) => d.id == session.annotation_id);
    use_annotation_at_index(index);
  }

  if (session.vcf) {
    load_vcf_from_url(session.vcf);
  }

  // if (session.bedpe) {
  //   console.log("Loading BEDPE:", session.bedpe);
  //   Not tested yet:
  //   load_bedpe_from_url(session.bedpe);
  // }

  if (session.bedpe_backend) {
    d3.csv(session.bedpe_backend, function (error, data) {
      if (error) {
        console.error("Error loading BEDPE:", error);
      } else {
        load_variants(data);
      }
    });
  }
  if (session.coverage_backend) {
    d3.text(session.coverage_backend, function (error, raw_text) {
      if (error) {
        console.error("Error reading coverage file from examples in backend:", error);
      } else {
        use_coverage(raw_text);
      }
    });
  }

  show_visualizer_tab();
}

load_session_if_present_in_url();
