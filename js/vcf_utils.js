import VCF, { parseBreakend } from "@gmod/vcf";

export function parse_whole_vcf(header_text, vcf_body_text) {
  const vcf_parser = new VCF({ header: header_text });
  let records = [];
  for (let line of vcf_body_text.split("\n")) {
    let variant = vcf_parser.parseLine(line);
    records.push(variant);
  }
  return records;
}

export function extract_bnd_info_to_strands(alt_for_bnd) {
  // From SplitThreader, given the ALT:
  // 'G]chr5:52747359]' -> strand2 = "+", strand1 = "+"
  // ']13:123456]T' -> strand2 = "+", strand1 = "-"
  // 'T[13:123456[' -> strand2 = "-", strand1 = "+"
  // '[17:198983[A' -> strand2 = "-", strand1 = "-"

  // strand1 is determined by whether the bases are shown before or after the bracketed info.
  // strand2 is determined by which way the brackets are facing, with ] being + and [ being -.

  let parsed_breakend = parseBreakend(alt_for_bnd);
  // e.g. parsed_breakend = {
  // 	MatePosition: 'chr5:52747359',
  // 	Join: 'right',
  // 	Replacement: 'G',
  // 	MateDirection: 'left'
  // };
  let chrom2 = parsed_breakend.MatePosition.split(":")[0];
  let pos2 = parseInt(parsed_breakend.MatePosition.split(":")[1]);
  let strand1 = parsed_breakend.Join === "right" ? "+" : "-";
  let strand2 = parsed_breakend.MateDirection === "left" ? "+" : "-";
  return { chrom2, pos2, strand1, strand2 };
}

export function convert_to_splitthreader_format(vcf_row_obj) {
  // e.g. vcf_row_obj = {
  // 	CHROM: 'chr1',
  // 	POS: 23272628,
  // 	ALT: ['G]chr5:52747359]'],
  // 	INFO: {
  // 		SVTYPE: ['BND'],
  // 		MATEID: ['DRAGEN:BND:63885:0:1:0:0:0:1'],
  // 		SOMATIC: true,
  // 		SOMATICSCORE: [381],
  // 		BND_DEPTH: [127],
  // 		MATE_BND_DEPTH: [136]
  // 	},
  // 	REF: 'G',
  // 	FILTER: 'PASS',
  // 	ID: ['DRAGEN:BND:63885:0:1:0:0:0:0'],
  // 	QUAL: null
  // };

  if (!vcf_row_obj.INFO) {
    throw new Error("Expected INFO field in VCF row but it was not found");
  }
  let output = {
    chrom1: vcf_row_obj.CHROM,
    pos1: vcf_row_obj.POS,
    svtype: vcf_row_obj.INFO.SVTYPE?.[0],
    variant_name: vcf_row_obj.ID?.[0],
  };

  if (vcf_row_obj.ALT && vcf_row_obj.ALT?.[0]) {
    output = {
      ...output,
      ...extract_bnd_info_to_strands(vcf_row_obj.ALT?.[0]),
    };
  } else {
    console.log("ALT reading not implemented for non-breakends yet.");
  }

  // Warn if any fields in output are undefined.
  for (let key in output) {
    if (output[key] === undefined) {
      console.warn(`Warning: "${key}" is undefined in output:`, output);
    }
  }

  if (vcf_row_obj.INFO.BND_DEPTH) {
    // Assuming BND_DEPTH is somewhat equivalent to how many reads support the breakend.
    output.split = vcf_row_obj.INFO.BND_DEPTH[0];
    // Unclear though because MATE_BND_DEPTH differs.
  }

  return output;
}

export function parse_and_convert_vcf(header_text, vcf_body_text) {
  let records = parse_whole_vcf(header_text, vcf_body_text);
  let splitthreader_records = records.map(convert_to_splitthreader_format);
  return splitthreader_records;
}
