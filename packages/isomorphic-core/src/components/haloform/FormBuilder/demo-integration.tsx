/**
 * Demo Integration Example
 * 
 * This shows how to integrate the invoice test scenario into your existing FormBuilder
 * to validate the calculated fields functionality.
 */

import React, { useState } from "react";
import FormPreview from "./FormPreview";
import ElementEditor from "./ElementEditor";
import { invoiceTestElements, validateInvoiceCalculations } from "./invoice-test-simple";
import { FormElementType } from "@haloform/types/form-builder";
import { Button } from "@haloform/ui/button";

const InvoiceDemo: React.FC = () => {
  const [elements, setElements] = useState<FormElementType[]>(invoiceTestElements);
  const [selectedElement, setSelectedElement] = useState<FormElementType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    // Load default test data
    item1_name: "Apples",
    item1_quantity: 2,
    item1_price: 100,
    item2_name: "Oranges",
    item2_quantity: 5,
    item2_price: 60,
    item3_name: "Bananas",
    item3_quantity: 3,
    item3_price: 50,
    item4_name: "Mangoes",
    item4_quantity: 4,
    item4_price: 80,
    item5_name: "Grapes",
    item5_quantity: 1,
    item5_price: 250,
  });

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleElementUpdate = (updatedElement: FormElementType) => {
    setElements(prev => 
      prev.map(el => el.id === updatedElement.id ? updatedElement : el)
    );
    setSelectedElement(updatedElement);
  };

  const runValidation = () => {
    const results = validateInvoiceCalculations(formData);
    
    console.log("🧮 Invoice Calculation Validation Results:");
    console.log("==========================================");
    
    results.subtotals.forEach(result => {
      const status = result.isCorrect ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} ${result.name}: Expected ${result.expected}, Got ${result.actual}`);
    });
    
    const grandTotalStatus = results.grandTotal.isCorrect ? "✅ PASS" : "❌ FAIL";
    console.log(`${grandTotalStatus} Grand Total: Expected ${results.grandTotal.expected}, Got ${results.grandTotal.actual}`);
    
    const allPassed = results.subtotals.every(r => r.isCorrect) && results.grandTotal.isCorrect;
    console.log(`\n🎯 Overall Result: ${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);
    
    return allPassed;
  };

  return (
    <div className="flex h-screen">
      {/* Form Preview */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex gap-2">
            <Button onClick={runValidation} variant="outline">
              🧮 Validate Calculations
            </Button>
            <Button 
              onClick={() => {
                const allPassed = runValidation();
                alert(allPassed ? "✅ All tests passed!" : "❌ Some tests failed. Check console for details.");
              }}
              variant="default"
            >
              🧪 Run Full Test
            </Button>
          </div>
          
          <FormPreview
            elements={elements}
            formData={formData}
            onInputChange={handleInputChange}
            colSpan={4}
          />
          
          {/* Real-time validation display */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
            <h4 className="font-medium mb-2">📊 Live Validation</h4>
            <div className="text-sm space-y-1">
              <div>Item 1: {formData.item1_quantity || 0} × ₦{formData.item1_price || 0} = ₦{(formData.item1_quantity || 0) * (formData.item1_price || 0)} (Actual: ₦{formData.item1_subtotal || 0})</div>
              <div>Grand Total Expected: ₦{
                (formData.item1_quantity || 0) * (formData.item1_price || 0) +
                (formData.item2_quantity || 0) * (formData.item2_price || 0) +
                (formData.item3_quantity || 0) * (formData.item3_price || 0) +
                (formData.item4_quantity || 0) * (formData.item4_price || 0) +
                (formData.item5_quantity || 0) * (formData.item5_price || 0)
              } (Actual: ₦{formData.grand_total || 0})</div>
            </div>
          </div>
        </div>
      </div>

      {/* Element Editor */}
      <div className="w-96 border-l border-border bg-background p-4 overflow-auto">
        <h3 className="font-semibold mb-4">Element Editor</h3>
        <div className="space-y-2 mb-4">
          {elements.map(element => (
            <Button
              key={element.id}
              variant={selectedElement?.id === element.id ? "default" : "outline"}
              size="sm"
              className="w-full justify-start text-left"
              onClick={() => setSelectedElement(element)}
            >
              <span className="truncate">
                {element.type === "header" ? "📄" : 
                 element.type === "text" ? "📝" :
                 element.type === "number" && element.properties.numberType === "calculated" ? "🧮" :
                 element.type === "number" ? "🔢" : "❓"} 
                {element.label}
              </span>
            </Button>
          ))}
        </div>
        
        {selectedElement && (
          <ElementEditor
            element={selectedElement}
            elements={elements}
            onElementUpdate={handleElementUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceDemo;
