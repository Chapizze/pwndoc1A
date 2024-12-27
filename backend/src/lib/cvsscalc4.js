const CVSS4 = {
  CVSSVersionIdentifier: "CVSS:4.0",
  
  // Constants for severity ratings
  SeverityRatings: {
    CRITICAL: {
      bottom: 9.0,
      top: 10.0
    },
    HIGH: {
      bottom: 7.0,
      top: 8.9
    },
    MEDIUM: {
      bottom: 4.0,
      top: 6.9
    },
    LOW: {
      bottom: 0.1,
      top: 3.9
    },
    NONE: {
      bottom: 0.0,
      top: 0.0
    }
  },

  // Metric value mappings
  MetricValues: {
    AttackVector: {
      NETWORK: { value: 0.85, shorthand: "N" },
      ADJACENT: { value: 0.6, shorthand: "A" },
      LOCAL: { value: 0.45, shorthand: "L" },
      PHYSICAL: { value: 0.2, shorthand: "P" }
    },
    AttackComplexity: {
      LOW: { value: 0.77, shorthand: "L" },
      HIGH: { value: 0.44, shorthand: "H" }
    },
    AttackRequirements: {
      NONE: { value: 0.85, shorthand: "N" },
      PRESENT: { value: 0.62, shorthand: "P" }
    },
    PrivilegesRequired: {
      NONE: { value: 0.85, shorthand: "N" },
      LOW: { value: 0.62, shorthand: "L" },
      HIGH: { value: 0.27, shorthand: "H" }
    },
    UserInteraction: {
      NONE: { value: 0.85, shorthand: "N" },
      PASSIVE: { value: 0.62, shorthand: "P" },
      ACTIVE: { value: 0.44, shorthand: "A" }
    },
    VulnerableSystemImpact: {
      HIGH: { value: 0.9, shorthand: "H" },
      LOW: { value: 0.3, shorthand: "L" },
      NONE: { value: 0, shorthand: "N" }
    },
    SubsequentSystemImpact: {
      HIGH: { value: 0.9, shorthand: "H" },
      LOW: { value: 0.3, shorthand: "L" },
      NONE: { value: 0, shorthand: "N" }
    }
  },

  // Calculate CVSS score from individual metrics
  calculateCVSSFromMetrics: function({
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
    subAvailability
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
      SA: subAvailability
    };

    const scores = this.calculateBaseScore(metrics);
    const severity = this.calculateSeverityRating(scores.baseScore);

    return {
      ...scores,
      severity,
      vectorString: this.generateVectorString(metrics)
    };
  },

  // Calculate base score
  calculateBaseScore: function(metrics) {
    if (!this.validateMetrics(metrics)) {
      throw new Error("Invalid metrics provided");
    }

    const eq1 = this.calculateExploitabilityScore(metrics);
    const eq2 = this.calculateVulnerableSystemScore(metrics);
    const eq3 = this.calculateSubsequentSystemScore(metrics);
    const baseScore = this.roundUp(Math.max(eq2, eq3) + eq1);
    
    return {
      baseScore: Math.min(baseScore, 10),
      eq1Score: eq1,
      eq2Score: eq2,
      eq3Score: eq3
    };
  },

  // Calculate CVSS from vector string
  calculateCVSSFromVector: function(vectorString) {
    const metrics = this.parseVectorString(vectorString);
    const scores = this.calculateBaseScore(metrics);
    const severity = this.calculateSeverityRating(scores.baseScore);

    return {
      ...scores,
      severity,
      vectorString
    };
  },

  // Calculate severity rating from score
  calculateSeverityRating: function(score) {
    for (const [severity, range] of Object.entries(this.SeverityRatings)) {
      if (score >= range.bottom && score <= range.top) {
        return severity;
      }
    }
    return "NONE";
  },

  // Generate vector string from metrics
  generateVectorString: function(metrics) {
    const parts = [this.CVSSVersionIdentifier];
    
    for (const [metric, value] of Object.entries(metrics)) {
      const metricGroup = this.getMetricGroup(metric);
      const shorthand = this.MetricValues[metricGroup][value].shorthand;
      parts.push(`${metric}:${shorthand}`);
    }

    return parts.join('/');
  },

  // Generate XML representation from metrics
  generateXMLFromMetrics: function(metrics) {
    const scores = this.calculateCVSSFromMetrics(metrics);
    return this.generateXML(scores, metrics);
  },

  // Generate XML representation from vector string
  generateXMLFromVector: function(vectorString) {
    const metrics = this.parseVectorString(vectorString);
    const scores = this.calculateCVSSFromVector(vectorString);
    return this.generateXML(scores, metrics);
  },

  // Helper function to generate XML
  generateXML: function(scores, metrics) {
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
  },

  // Calculate exploitability sub-score (EQ1)
  calculateExploitabilityScore: function(metrics) {
    const av = this.MetricValues.AttackVector[metrics.AV].value;
    const ac = this.MetricValues.AttackComplexity[metrics.AC].value;
    const at = this.MetricValues.AttackRequirements[metrics.AT].value;
    const pr = this.MetricValues.PrivilegesRequired[metrics.PR].value;
    const ui = this.MetricValues.UserInteraction[metrics.UI].value;

    return this.roundUp(((av + ac + at + pr + ui) / 5) * 2);
  },

  // Calculate vulnerable system impact sub-score (EQ2)
  calculateVulnerableSystemScore: function(metrics) {
    const getImpactValue = (metric) => this.MetricValues.VulnerableSystemImpact[metric].value;
    const c = getImpactValue(metrics.VC);
    const i = getImpactValue(metrics.VI);
    const a = getImpactValue(metrics.VA);

    return this.roundUp(Math.max(c, i, a) * 4);
  },

  // Calculate subsequent system impact sub-score (EQ3)
  calculateSubsequentSystemScore: function(metrics) {
    const getImpactValue = (metric) => this.MetricValues.SubsequentSystemImpact[metric].value;
    const c = getImpactValue(metrics.SC);
    const i = getImpactValue(metrics.SI);
    const a = getImpactValue(metrics.SA);

    return this.roundUp(Math.max(c, i, a) * 4);
  },

  // Helper function to get metric group from metric name
  getMetricGroup: function(metric) {
    const groups = {
      AV: 'AttackVector',
      AC: 'AttackComplexity',
      AT: 'AttackRequirements',
      PR: 'PrivilegesRequired',
      UI: 'UserInteraction',
      VC: 'VulnerableSystemImpact',
      VI: 'VulnerableSystemImpact',
      VA: 'VulnerableSystemImpact',
      SC: 'SubsequentSystemImpact',
      SI: 'SubsequentSystemImpact',
      SA: 'SubsequentSystemImpact'
    };
    return groups[metric];
  },

  // Parse CVSS vector string
  parseVectorString: function(vectorString) {
    if (!vectorString.startsWith(this.CVSSVersionIdentifier)) {
      throw new Error("Invalid CVSS string: must start with " + this.CVSSVersionIdentifier);
    }

    const metrics = {};
    const vectorParts = vectorString.split('/');
    
    vectorParts.slice(1).forEach(part => {
      const [metric, value] = part.split(':');
      if (metric && value) {
        metrics[metric] = this.getMetricValueFromShorthand(metric, value);
      }
    });

    return metrics;
  },

  // Get full metric value from shorthand
  getMetricValueFromShorthand: function(metric, shorthand) {
    const group = this.getMetricGroup(metric);
    for (const [key, data] of Object.entries(this.MetricValues[group])) {
      if (data.shorthand === shorthand) {
        return key;
      }
    }
    throw new Error(`Invalid value ${shorthand} for metric ${metric}`);
  },

  // Helper function to validate metrics
  validateMetrics: function(metrics) {
    const requiredMetrics = ['AV', 'AC', 'AT', 'PR', 'UI', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA'];
    return requiredMetrics.every(metric => metrics.hasOwnProperty(metric));
  },

  // Helper function to round up to 1 decimal place
  roundUp: function(num) {
    return Math.ceil(num * 10) / 10;
  }
};

export default CVSS4;