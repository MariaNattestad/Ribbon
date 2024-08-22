import VCF, { parseBreakend } from "@gmod/vcf";
import $ from "jquery";
import {
  parse_whole_vcf,
  extract_bnd_info_to_strands,
  convert_to_splitthreader_format,
} from "./vcf_utils";

console.log("VCF", parseBreakend)

// import d3 from "d3";
// import "./index_ribbon";

// import ribbon from "./index_ribbon"
// console.log(ribbon)
