import os
import re
from typing import Dict, List, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

class ClauseExtractor:
    """Extracts and analyzes clauses from legal documents."""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("❌ Google Gemini API key is missing!")
        
        self.llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-pro",
            temperature=0.2,
            google_api_key=api_key
        )
        
        # Common clause types in legal documents
        self.clause_types = {
            "payment": ["payment", "compensation", "salary", "fee", "cost", "price", "amount"],
            "termination": ["termination", "terminate", "end", "expiry", "dissolution", "cancellation"],
            "liability": ["liability", "responsible", "damages", "loss", "harm", "injury"],
            "confidentiality": ["confidential", "non-disclosure", "proprietary", "trade secret"],
            "intellectual_property": ["intellectual property", "copyright", "patent", "trademark", "ip"],
            "dispute_resolution": ["dispute", "arbitration", "litigation", "court", "mediation"],
            "governing_law": ["governing law", "jurisdiction", "applicable law", "legal system"],
            "force_majeure": ["force majeure", "act of god", "unforeseeable", "beyond control"],
            "warranties": ["warranty", "guarantee", "representation", "assurance"],
            "indemnification": ["indemnify", "hold harmless", "defend", "reimburse"]
        }
    
    def extract_clauses_from_text(self, document_text: str) -> Dict[str, Any]:
        """Extract clauses from document text using AI."""
        
        prompt = f"""
        You are a legal document analysis expert. Analyze the following legal document and extract key clauses.
        
        For each clause found, provide the information in this EXACT format:
        
        CLAUSE_START
        Type: [Clause type like Payment, Termination, Liability, etc.]
        Text: [The actual clause text from the document]
        Key Points: [Main points in plain text, no bullet points or asterisks]
        Risk Level: [High/Medium/Low]
        Analysis: [Brief analysis in plain text, no formatting symbols]
        CLAUSE_END
        
        Document Text:
        {document_text}
        
        IMPORTANT FORMATTING RULES:
        - Use plain text only, no asterisks (*), bullet points, or special formatting
        - Each clause must start with CLAUSE_START and end with CLAUSE_END
        - Use simple sentences and avoid excessive formatting
        - Focus on the most important and legally significant clauses
        """
        
        try:
            response = self.llm.invoke(prompt)
            analysis = response.content if hasattr(response, 'content') else str(response)
            
            # Parse the AI response and structure it
            structured_clauses = self._parse_ai_response(analysis)
            
            return {
                "clauses": structured_clauses,
                "summary": self._generate_clause_summary(structured_clauses),
                "total_clauses": len(structured_clauses)
            }
            
        except Exception as e:
            print(f"❌ Error in clause extraction: {e}")
            return {"error": f"Failed to extract clauses: {str(e)}"}
    
    def extract_clauses_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Extract clauses from a PDF file."""
        try:
            # Load PDF
            loader = PyPDFLoader(pdf_path)
            documents = loader.load()
            
            # Combine all pages
            full_text = "\n\n".join([doc.page_content for doc in documents])
            
            # Extract clauses
            return self.extract_clauses_from_text(full_text)
            
        except Exception as e:
            print(f"❌ Error processing PDF: {e}")
            return {"error": f"Failed to process PDF: {str(e)}"}
    
    def _parse_ai_response(self, ai_response: str) -> List[Dict[str, Any]]:
        """Parse AI response into structured clause data using regex with fallbacks."""
        clauses = []
        
        # Clean response by removing excessive asterisks and formatting
        cleaned_response = self._clean_ai_response(ai_response)
        
        # Method 1: Try to parse using CLAUSE_START/CLAUSE_END markers
        clause_blocks = re.findall(r'CLAUSE_START(.*?)CLAUSE_END', cleaned_response, re.DOTALL | re.IGNORECASE)
        
        if clause_blocks:
            for block in clause_blocks:
                clause = self._extract_clause_fields(block)
                if clause:
                    clauses.append(clause)
        else:
            # Method 2: Fallback to old parsing method for backward compatibility
            clauses = self._fallback_parse(cleaned_response)
        
        return clauses
    
    def _clean_ai_response(self, response: str) -> str:
        """Clean AI response by removing excessive formatting symbols."""
        # Remove excessive asterisks and bullet points
        cleaned = re.sub(r'\*{2,}', '', response)  # Remove multiple asterisks
        cleaned = re.sub(r'^\s*[\*\-\•]\s*', '', cleaned, flags=re.MULTILINE)  # Remove bullet points
        cleaned = re.sub(r'\*([^\*]+)\*', r'\1', cleaned)  # Remove single asterisk emphasis
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)  # Reduce multiple newlines
        return cleaned.strip()
    
    def _extract_clause_fields(self, clause_block: str) -> Dict[str, Any]:
        """Extract clause fields from a clause block using regex."""
        clause = {}
        
        # Define regex patterns for each field
        patterns = {
            'type': r'Type:\s*([^\n]+)',
            'text': r'Text:\s*([^\n]+(?:\n(?!(?:Key Points|Risk Level|Analysis):)[^\n]*)*)',
            'key_points': r'Key Points:\s*([^\n]+(?:\n(?!(?:Risk Level|Analysis):)[^\n]*)*)',
            'risk_level': r'Risk Level:\s*([^\n]+)',
            'analysis': r'Analysis:\s*([^\n]+(?:\n(?!(?:Type|Text|Key Points|Risk Level):)[^\n]*)*)'
        }
        
        for field, pattern in patterns.items():
            match = re.search(pattern, clause_block, re.IGNORECASE | re.DOTALL)
            if match:
                value = match.group(1).strip()
                # Further clean the extracted value
                value = re.sub(r'^[\*\-\•]\s*', '', value, flags=re.MULTILINE)
                clause[field] = value
            else:
                clause[field] = 'Not specified'
        
        return clause if any(v != 'Not specified' for v in clause.values()) else None
    
    def _fallback_parse(self, ai_response: str) -> List[Dict[str, Any]]:
        """Fallback parsing method for backward compatibility."""
        clauses = []
        sections = ai_response.split('\n\n')
        
        current_clause = {}
        for section in sections:
            if section.strip():
                section_clean = section.strip()
                
                # Try to identify different parts of the clause analysis
                if re.search(r'(Type:|Clause Type:)', section_clean, re.IGNORECASE):
                    if current_clause and any(current_clause.values()):
                        clauses.append(current_clause)
                        current_clause = {}
                    match = re.search(r'(?:Type:|Clause Type:)\s*(.+)', section_clean, re.IGNORECASE)
                    current_clause['type'] = match.group(1).strip() if match else 'Unknown'
                    
                elif re.search(r'(Text:|Clause Text:)', section_clean, re.IGNORECASE):
                    match = re.search(r'(?:Text:|Clause Text:)\s*(.+)', section_clean, re.IGNORECASE | re.DOTALL)
                    current_clause['text'] = match.group(1).strip() if match else 'Not specified'
                    
                elif re.search(r'Key Points:', section_clean, re.IGNORECASE):
                    match = re.search(r'Key Points:\s*(.+)', section_clean, re.IGNORECASE | re.DOTALL)
                    current_clause['key_points'] = match.group(1).strip() if match else 'Not specified'
                    
                elif re.search(r'Risk Level:', section_clean, re.IGNORECASE):
                    match = re.search(r'Risk Level:\s*(.+)', section_clean, re.IGNORECASE)
                    current_clause['risk_level'] = match.group(1).strip() if match else 'Unknown'
                    
                elif re.search(r'Analysis:', section_clean, re.IGNORECASE):
                    match = re.search(r'Analysis:\s*(.+)', section_clean, re.IGNORECASE | re.DOTALL)
                    current_clause['analysis'] = match.group(1).strip() if match else 'Not specified'
        
        if current_clause and any(current_clause.values()):
            clauses.append(current_clause)
        
        return clauses
    
    def _generate_clause_summary(self, clauses: List[Dict[str, Any]]) -> str:
        """Generate a summary of extracted clauses."""
        if not clauses:
            return "No clauses were extracted from the document."
        
        clause_types = [clause.get('type', 'Unknown') for clause in clauses]
        risk_levels = [clause.get('risk_level', 'Unknown') for clause in clauses]
        
        high_risk_count = sum(1 for risk in risk_levels if 'high' in risk.lower())
        
        summary = f"""
        Clause Extraction Summary:
        - Total clauses extracted: {len(clauses)}
        - Clause types found: {', '.join(set(clause_types))}
        - High-risk clauses: {high_risk_count}
        - Document coverage: Comprehensive analysis completed
        """
        
        return summary.strip()
    
    def analyze_clause_risks(self, clauses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze risks across all extracted clauses."""
        if not clauses:
            return {"error": "No clauses to analyze"}
        
        risk_analysis = {
            "high_risk": [],
            "medium_risk": [],
            "low_risk": [],
            "recommendations": []
        }
        
        for clause in clauses:
            risk_level = clause.get('risk_level', '').lower()
            clause_summary = {
                "type": clause.get('type', 'Unknown'),
                "text": clause.get('text', '')[:200] + "..." if len(clause.get('text', '')) > 200 else clause.get('text', ''),
                "analysis": clause.get('analysis', '')
            }
            
            if 'high' in risk_level:
                risk_analysis["high_risk"].append(clause_summary)
            elif 'medium' in risk_level:
                risk_analysis["medium_risk"].append(clause_summary)
            else:
                risk_analysis["low_risk"].append(clause_summary)
        
        # Generate recommendations
        if risk_analysis["high_risk"]:
            risk_analysis["recommendations"].append("Review high-risk clauses with legal counsel")
        if len(risk_analysis["high_risk"]) > 3:
            risk_analysis["recommendations"].append("Consider renegotiating terms to reduce risk exposure")
        
        return risk_analysis
    
    def compare_clauses(self, document1_clauses: List[Dict], document2_clauses: List[Dict]) -> Dict[str, Any]:
        """Compare clauses between two documents."""
        
        comparison_prompt = f"""
        Compare the following clauses from two different legal documents and provide:
        1. Common clause types
        2. Differences in terms
        3. Risk comparison
        4. Recommendations for alignment
        
        Document 1 Clauses:
        {document1_clauses}
        
        Document 2 Clauses:
        {document2_clauses}
        
        Provide a detailed comparison analysis.
        """
        
        try:
            response = self.llm.invoke(comparison_prompt)
            analysis = response.content if hasattr(response, 'content') else str(response)
            cleaned_analysis = self._clean_ai_response(analysis)
            
            return {
                "comparison_analysis": cleaned_analysis,
                "doc1_clause_count": len(document1_clauses),
                "doc2_clause_count": len(document2_clauses)
            }
            
        except Exception as e:
            return {"error": f"Failed to compare clauses: {str(e)}"}
