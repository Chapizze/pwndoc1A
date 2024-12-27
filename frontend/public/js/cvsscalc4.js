const CVSS4 = {};

CVSS4.CVSSVersionIdentifier = "CVSS:4.0";

CVSS4.SeverityRatings = {
  Critical: { bottom: 9.0, top: 10.0 },
  High: { bottom: 7.0, top: 8.9 },
  Medium: { bottom: 4.0, top: 6.9 },
  Low: { bottom: 0.1, top: 3.9 },
  None: { bottom: 0.0, top: 0.0 }
};

CVSS4.MetricValues = {
  AttackVector: {
    N: { value: 0.0, shorthand: "N" },
    A: { value: 0.1, shorthand: "A" },
    L: { value: 0.2, shorthand: "L" },
    P: { value: 0.3, shorthand: "P" }
  },
  AttackComplexity: {
    L: { value: 0.0, shorthand: "L" },
    H: { value: 0.1, shorthand: "H" }
  },
  AttackRequirements: {
    N: { value: 0.0, shorthand: "N" },
    P: { value: 0.1, shorthand: "P" }
  },
  PrivilegesRequired: {
    N: { value: 0.0, shorthand: "N" },
    L: { value: 0.1, shorthand: "L" },
    H: { value: 0.2, shorthand: "H" }
  },
  UserInteraction: {
    N: { value: 0.0, shorthand: "N" },
    P: { value: 0.1, shorthand: "P" },
    A: { value: 0.2, shorthand: "A" }
  },
  VulnerableSystemImpact: {
    H: { value: 0.0, shorthand: "H" },
    L: { value: 0.1, shorthand: "L" },
    N: { value: 0.2, shorthand: "N" }
  },
  SubsequentSystemImpact: {
    H: { value: 0.0, shorthand: "H" },
    L: { value: 0.1, shorthand: "L" },
    N: { value: 0.2, shorthand: "N" }
  },
  
};

CVSS4.calculateCVSSFromMetrics = function({
  attackVector,
  attackComplexity,
  attackRequirements,
  privilegesRequired,
  userInteraction,
  vulnConfidentiality,
  vulnIntegrity,
  vulnAvailability,
  subConfidentiality,
  subIntegrity,
  subAvailability,

}) {
  const metrics = {
    AV: attackVector,
    AC: attackComplexity,
    AT: attackRequirements,
    PR: privilegesRequired,
    UI: userInteraction,
    VC: vulnConfidentiality,
    VI: vulnIntegrity,
    VA: vulnAvailability,
    SC: subConfidentiality,
    SI: subIntegrity,
    SA: subAvailability,

   
  };

  const scores = CVSS4.calculateBaseScore(metrics);
  
  const severity = CVSS4.calculateSeverityRating(scores.baseScore);

  return {
    ...scores,
    severity,
    vectorString: CVSS4.generateVectorString(metrics)
  };
};


CVSS4.calculateCVSSFromVector = function(vectorString) {
  console.log(vectorString)
  const metrics = CVSS4.parseVectorString(vectorString);
  var scores = {};
  if (["VC4", "VI4", "VA4", "SC4", "SI4", "SA4"].every((metric) => (metrics[metric]) === "N")) {
    scores.baseScore =  "0.0";
  }
  else{
    var data = CVSS4.macroVector(metrics);
    console.log(data);
    scores.baseScore = cvssLookup_global[data];
    console.log(scores)


  }
 
  const baseSeverity = CVSS4.calculateSeverityRating(scores.baseScore);
  return {
    ...scores,
    baseSeverity,
    vectorString
  };
};

CVSS4.calculateSeverityRating = function(score) {
  for (const [severity, range] of Object.entries(CVSS4.SeverityRatings)) {
    if (score >= range.bottom && score <= range.top) {
      return severity;
    }
  }
  return "None";
};

CVSS4.generateVectorString = function(metrics) {
  const parts = [CVSS4.CVSSVersionIdentifier];

  for (const [metric, value] of Object.entries(metrics)) {
    const metricGroup = CVSS4.getMetricGroup(metric);
    const shorthand = CVSS4.MetricValues[metricGroup][value].shorthand;
    parts.push(`${metric}:${shorthand}`);
  }

  return parts.join('/');
};

CVSS4.generateXMLFromMetrics = function(metrics) {
  const scores = CVSS4.calculateCVSSFromMetrics(metrics);
  return CVSS4.generateXML(scores, metrics);
};

CVSS4.generateXMLFromVector = function(vectorString) {
  const metrics = CVSS4.parseVectorString(vectorString);
  const scores = CVSS4.calculateCVSSFromVector(vectorString);
  return CVSS4.generateXML(scores, metrics);
};

CVSS4.generateXML = function(scores, metrics) {
  const xml = [];
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<cvss4.0>');
  xml.push('  <base-metrics>');

  // Add metrics
  for (const [metric, value] of Object.entries(metrics)) {
    xml.push(`    <${metric.toLowerCase()}>${value}</${metric.toLowerCase()}>`);
  }

  // Add scores
  xml.push(`    <base-score>${scores.baseScore}</base-score>`);
  xml.push(`    <eq1-score>${scores.eq1Score}</eq1-score>`);
  xml.push(`    <eq2-score>${scores.eq2Score}</eq2-score>`);
  xml.push(`    <eq3-score>${scores.eq3Score}</eq3-score>`);
  xml.push(`    <severity>${scores.severity}</severity>`);

  xml.push('  </base-metrics>');
  xml.push(`  <vector-string>${scores.vectorString}</vector-string>`);
  xml.push('</cvss4.0>');

  return xml.join('\n');
};

CVSS4.getMetricGroup = function(metric) {
  const groups = {
    AV4: 'AttackVector',
    AC4: 'AttackComplexity',
    AT4: 'AttackRequirements',
    PR4: 'PrivilegesRequired',
    UI4: 'UserInteraction',
    VC4: 'VulnerableSystemImpact',
    VI4: 'VulnerableSystemImpact',
    VA4: 'VulnerableSystemImpact',
    SC4: 'SubsequentSystemImpact',
    SI4: 'SubsequentSystemImpact',
    SA4: 'SubsequentSystemImpact',
   /* E4: 'Exploit Maturity',
    CR4: ' Confidentiality Requirements',
    IR4: "Integrity Requirements",
    AR4: "Availability Requirements",
    MAV4: 'AttackVector',
    MAC4: 'AttackComplexity',
    MAT4: 'AttackRequirements',
    MPR4: 'PrivilegesRequired',
    MUI4: 'UserInteraction',
    MVC4: 'VulnerableSystemImpact',
    MVI4: 'VulnerableSystemImpact',
    MVA4: 'VulnerableSystemImpact',
    MSC4: 'SubsequentSystemImpact',
    MSC4: 'SubsequentSystemImpact',
    MSA4: 'SubsequentSystemImpact',*/
  
  };
  const metricKey = metric.toUpperCase();
  return groups[metricKey];
};

CVSS4.parseVectorString = function(vectorString) {
  if (!vectorString.startsWith(CVSS4.CVSSVersionIdentifier)) {
    throw new Error("Invalid CVSS string: must start with " + CVSS4.CVSSVersionIdentifier);
  }

  const metrics = {};
  const vectorParts = vectorString.split('/');

  vectorParts.slice(1).forEach(part => {
    const [metric, value] = part.split(':');
    if (metric && value) {
      metrics[metric] = CVSS4.getMetricValueFromShorthand(metric, value);
    }
  });
  return metrics;
};

CVSS4.getMetricValueFromShorthand = function(metric, shorthand) {
  const group = CVSS4.getMetricGroup(metric);
  for (const [key, data] of Object.entries(CVSS4.MetricValues[group])) {
    if (data.shorthand === shorthand) {
      return key;
    }
  }
  // Instead of throwing an error, log a warning and return null
  console.warn(`No matching shorthand found for metric ${metric} with value ${shorthand}`);
  return null;
};

CVSS4.validateMetrics = function(metrics) {
  const requiredMetrics = ['AV4', 'AC4', 'AT4', 'PR4', 'UI4', 'VC4', 'VI4', 'VA4', 'SC4', 'SI4', 'SA4'];
  return requiredMetrics.every(metric => metrics.hasOwnProperty(metric));
};

CVSS4.roundUp = function(num) {
  return Math.ceil(num * 10) / 10;
};

CVSS4.macroVector = function(metrics) {
  var eq1="0";
  var eq2="0";
  var eq3="0";
  var eq4="0";
  var eq5="0";
  var eq6="0";

    // EQ1: 0-AV:N and PR:N and UI:N
    //      1-(AV:N or PR:N or UI:N) and not (AV:N and PR:N and UI:N) and not AV:P
    //      2-AV:P or not(AV:N or PR:N or UI:N)

  if (metrics.AV4 === "N" && metrics.PR4 === "N" && metrics.UI4 === "N") {
      eq1 = "0"
  }

  else if ((metrics.AV4 === "N" || metrics.PR4 === "N" || metrics.UI4 === "N")  && !(metrics.AV4 === "N" && metrics.PR4 === "N" && metrics.UI4 === "N")
      && !(metrics.AV4 === "P")) {
      eq1 = "1"
  }
  else if ((metrics.AV4 === "P") || !(metrics.AV4 === "N" || metrics.PR4 === "N" || metrics.UI4 === "N")) {
      eq1 = "2"
  }


  // EQ2: 0-(AC:L and AT:N)
  //      1-(not(AC:L and AT:N))

  if (metrics.AC4 === "L" && metrics.AT4 === "N") {
      eq2 = "0"
  }
  else if (!metrics.AC4 === "L" && metrics.AT4 === "N") {
      eq2 = "1"
  }

  // EQ3: 0-(VC:H and VI:H)
  //      1-(not(VC:H and VI:H) and (VC:H or VI:H or VA:H))
  //      2-not (VC:H or VI:H or VA:H)
  if (metrics.VC4 === "H" && metrics.VI4 === "H") {
      eq3 = 0
  }
  else if (!(metrics.VC4 === "H" && metrics.VI4 === "H")
      && (metrics.VC4 === "H" || metrics.VI4 === "H" || metrics.VA4 === "H")) {
      eq3 = 1
  }
  else if (!(metrics.VC4 === "H" || metrics.VI4 === "H" || metrics.VA4 === "H")) {
      eq3 = 2
  }

  // EQ4: 0-(MSI:S or MSA:S)
  //      1-not (MSI:S or MSA:S) and (SC:H or SI:H or SA:H)
  //      2-not (MSI:S or MSA:S) and not (SC:H or SI:H or SA:H)

  /*if (metrics.MSI === "S" || metrics.MSA === "S") {
      eq4 = 0
  }*/
  /*else if ((metrics.MSI === "S" || metrics.MSA === "S") &&
      (metrics.SC4 === "H" || metrics.SI4 === "H" || metrics.SA4 === "H")) {
      eq4 = 1
  }*/
    else if ((metrics.SC4 === "H" || metrics.SI4 === "H" || metrics.SA4 === "H")) {
      eq4 = 1
  }
  /*else if ((!metrics.MSI === "S" || metrics.MSA === "S") &&
      !(metrics.SC4 === "H" || metrics.SI4 === "H" || metrics.SA4 === "H")) {
      eq4 = 2
  }*/

    else if (!(metrics.SC4 === "H" || metrics.SI4 === "H" || metrics.SA4 === "H")) {
      eq4 = 2
    }


  // EQ5: 0-E:A
  //      1-E:P
  //      2-E:U
/*
  if (metrics.E === "A") {
      eq5 = 0
  }
  else if (metrics.E === "P") {
      eq5 = 1
  }
  else if (metrics.E === "U") {
      eq5 = 2
  }*/

  // EQ6: 0-(CR:H and VC:H) or (IR:H and VI:H) or (AR:H and VA:H)
  //      1-not[(CR:H and VC:H) or (IR:H and VI:H) or (AR:H and VA:H)]
/*
  if ((metrics.CR === "H" && metrics.VC4 === "H")
      || (metrics.IR === "H" && metrics.VI4 === "H")
      || (metrics.AR === "H" && metrics.VA4 === "H")) {
      eq6 = 0
  }*/
 /*
  else if ((!metrics.CR === "H" && metrics.VC4 === "H")
      || (metrics.IR === "H" && metrics.VI4 === "H")
      || (metrics.AR === "H" && metrics.VA4 === "H")) {
      eq6 = 1
  }*/
      else if ((metrics.VC4 === "H") || (metrics.VI4 === "H") || (metrics.VA4 === "H")) {
        eq6 = 1
    }
  return eq1 + eq2 + eq3 + eq4 + eq5 + eq6
};


const cvssLookup_global = {
  "000000": 10,
  "000001": 9.9,
  "000010": 9.8,
  "000011": 9.5,
  "000020": 9.5,
  "000021": 9.2,
  "000100": 10,
  "000101": 9.6,
  "000110": 9.3,
  "000111": 8.7,
  "000120": 9.1,
  "000121": 8.1,
  "000200": 9.3,
  "000201": 9,
  "000210": 8.9,
  "000211": 8,
  "000220": 8.1,
  "000221": 6.8,
  "001000": 9.8,
  "001001": 9.5,
  "001010": 9.5,
  "001011": 9.2,
  "001020": 9,
  "001021": 8.4,
  "001100": 9.3,
  "001101": 9.2,
  "001110": 8.9,
  "001111": 8.1,
  "001120": 8.1,
  "001121": 6.5,
  "001200": 8.8,
  "001201": 8,
  "001210": 7.8,
  "001211": 7,
  "001220": 6.9,
  "001221": 4.8,
  "002001": 9.2,
  "002011": 8.2,
  "002021": 7.2,
  "002101": 7.9,
  "002111": 6.9,
  "002121": 5,
  "002201": 6.9,
  "002211": 5.5,
  "002221": 2.7,
  "010000": 9.9,
  "010001": 9.7,
  "010010": 9.5,
  "010011": 9.2,
  "010020": 9.2,
  "010021": 8.5,
  "010100": 9.5,
  "010101": 9.1,
  "010110": 9,
  "010111": 8.3,
  "010120": 8.4,
  "010121": 7.1,
  "010200": 9.2,
  "010201": 8.1,
  "010210": 8.2,
  "010211": 7.1,
  "010220": 7.2,
  "010221": 5.3,
  "011000": 9.5,
  "011001": 9.3,
  "011010": 9.2,
  "011011": 8.5,
  "011020": 8.5,
  "011021": 7.3,
  "011100": 9.2,
  "011101": 8.2,
  "011110": 8,
  "011111": 7.2,
  "011120": 7,
  "011121": 5.9,
  "011200": 8.4,
  "011201": 7,
  "011210": 7.1,
  "011211": 5.2,
  "011220": 5,
  "011221": 3,
  "012001": 8.6,
  "012011": 7.5,
  "012021": 5.2,
  "012101": 7.1,
  "012111": 5.2,
  "012121": 2.9,
  "012201": 6.3,
  "012211": 2.9,
  "012221": 1.7,
  "100000": 9.8,
  "100001": 9.5,
  "100010": 9.4,
  "100011": 8.7,
  "100020": 9.1,
  "100021": 8.1,
  "100100": 9.4,
  "100101": 8.9,
  "100110": 8.6,
  "100111": 7.4,
  "100120": 7.7,
  "100121": 6.4,
  "100200": 8.7,
  "100201": 7.5,
  "100210": 7.4,
  "100211": 6.3,
  "100220": 6.3,
  "100221": 4.9,
  "101000": 9.4,
  "101001": 8.9,
  "101010": 8.8,
  "101011": 7.7,
  "101020": 7.6,
  "101021": 6.7,
  "101100": 8.6,
  "101101": 7.6,
  "101110": 7.4,
  "101111": 5.8,
  "101120": 5.9,
  "101121": 5,
  "101200": 7.2,
  "101201": 5.7,
  "101210": 5.7,
  "101211": 5.2,
  "101220": 5.2,
  "101221": 2.5,
  "102001": 8.3,
  "102011": 7,
  "102021": 5.4,
  "102101": 6.5,
  "102111": 5.8,
  "102121": 2.6,
  "102201": 5.3,
  "102211": 2.1,
  "102221": 1.3,
  "110000": 9.5,
  "110001": 9,
  "110010": 8.8,
  "110011": 7.6,
  "110020": 7.6,
  "110021": 7,
  "110100": 9,
  "110101": 7.7,
  "110110": 7.5,
  "110111": 6.2,
  "110120": 6.1,
  "110121": 5.3,
  "110200": 7.7,
  "110201": 6.6,
  "110210": 6.8,
  "110211": 5.9,
  "110220": 5.2,
  "110221": 3,
  "111000": 8.9,
  "111001": 7.8,
  "111010": 7.6,
  "111011": 6.7,
  "111020": 6.2,
  "111021": 5.8,
  "111100": 7.4,
  "111101": 5.9,
  "111110": 5.7,
  "111111": 5.7,
  "111120": 4.7,
  "111121": 2.3,
  "111200": 6.1,
  "111201": 5.2,
  "111210": 5.7,
  "111211": 2.9,
  "111220": 2.4,
  "111221": 1.6,
  "112001": 7.1,
  "112011": 5.9,
  "112021": 3,
  "112101": 5.8,
  "112111": 2.6,
  "112121": 1.5,
  "112201": 2.3,
  "112211": 1.3,
  "112221": 0.6,
  "200000": 9.3,
  "200001": 8.7,
  "200010": 8.6,
  "200011": 7.2,
  "200020": 7.5,
  "200021": 5.8,
  "200100": 8.6,
  "200101": 7.4,
  "200110": 7.4,
  "200111": 6.1,
  "200120": 5.6,
  "200121": 3.4,
  "200200": 7,
  "200201": 5.4,
  "200210": 5.2,
  "200211": 4,
  "200220": 4,
  "200221": 2.2,
  "201000": 8.5,
  "201001": 7.5,
  "201010": 7.4,
  "201011": 5.5,
  "201020": 6.2,
  "201021": 5.1,
  "201100": 7.2,
  "201101": 5.7,
  "201110": 5.5,
  "201111": 4.1,
  "201120": 4.6,
  "201121": 1.9,
  "201200": 5.3,
  "201201": 3.6,
  "201210": 3.4,
  "201211": 1.9,
  "201220": 1.9,
  "201221": 0.8,
  "202001": 6.4,
  "202011": 5.1,
  "202021": 2,
  "202101": 4.7,
  "202111": 2.1,
  "202121": 1.1,
  "202201": 2.4,
  "202211": 0.9,
  "202221": 0.4,
  "210000": 8.8,
  "210001": 7.5,
  "210010": 7.3,
  "210011": 5.3,
  "210020": 6,
  "210021": 5,
  "210100": 7.3,
  "210101": 5.5,
  "210110": 5.9,
  "210111": 4,
  "210120": 4.1,
  "210121": 2,
  "210200": 5.4,
  "210201": 4.3,
  "210210": 4.5,
  "210211": 2.2,
  "210220": 2,
  "210221": 1.1,
  "211000": 7.5,
  "211001": 5.5,
  "211010": 5.8,
  "211011": 4.5,
  "211020": 4,
  "211021": 2.1,
  "211100": 6.1,
  "211101": 5.1,
  "211110": 4.8,
  "211111": 1.8,
  "211120": 2,
  "211121": 0.9,
  "211200": 4.6,
  "211201": 1.8,
  "211210": 1.7,
  "211211": 0.7,
  "211220": 0.8,
  "211221": 0.2,
  "212001": 5.3,
  "212011": 2.4,
  "212021": 1.4,
  "212101": 2.4,
  "212111": 1.2,
  "212121": 0.5,
  "212201": 1,
  "212211": 0.3,
  "212221": 0.1,
}
