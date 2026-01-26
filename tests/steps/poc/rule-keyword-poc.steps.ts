/**
 * PoC: Rule Keyword Support Test
 *
 * This step definition file tests whether vitest-cucumber correctly
 * handles the Gherkin Rule keyword for organizing scenarios.
 *
 * CORRECT SYNTAX: Use Rule() with RuleScenario() inside, not Scenario()
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";

const feature = await loadFeature("tests/features/poc/rule-keyword-poc.feature");

describeFeature(feature, ({ Background, Rule }) => {
  // Shared state across scenarios
  let firstNumber: number;
  let secondNumber: number;
  let result: number | null;
  let error: string | null;

  Background(({ Given }) => {
    Given("a test context is initialized", () => {
      firstNumber = 0;
      secondNumber = 0;
      result = null;
      error = null;
    });
  });

  // vitest-cucumber requires Rule() function with RuleScenario() inside
  Rule("Basic arithmetic operations work correctly", ({ RuleScenario }) => {
    RuleScenario("Addition of two positive numbers", ({ Given, And, When, Then }) => {
      Given("the first number is 5", () => {
        firstNumber = 5;
      });

      And("the second number is 3", () => {
        secondNumber = 3;
      });

      When("I add the numbers", () => {
        result = firstNumber + secondNumber;
      });

      Then("the result should be 8", () => {
        expect(result).toBe(8);
      });
    });

    RuleScenario("Subtraction of two numbers", ({ Given, And, When, Then }) => {
      Given("the first number is 10", () => {
        firstNumber = 10;
      });

      And("the second number is 4", () => {
        secondNumber = 4;
      });

      When("I subtract the numbers", () => {
        result = firstNumber - secondNumber;
      });

      Then("the result should be 6", () => {
        expect(result).toBe(6);
      });
    });
  });

  Rule("Division has special constraints", ({ RuleScenario }) => {
    RuleScenario("Division of two numbers", ({ Given, And, When, Then }) => {
      Given("the first number is 20", () => {
        firstNumber = 20;
      });

      And("the second number is 4", () => {
        secondNumber = 4;
      });

      When("I divide the numbers", () => {
        result = firstNumber / secondNumber;
      });

      Then("the result should be 5", () => {
        expect(result).toBe(5);
      });
    });

    RuleScenario("Division by zero is prevented", ({ Given, And, When, Then }) => {
      Given("the first number is 10", () => {
        firstNumber = 10;
      });

      And("the second number is 0", () => {
        secondNumber = 0;
      });

      When("I attempt to divide the numbers", () => {
        if (secondNumber === 0) {
          error = "Division by zero";
          result = null;
        } else {
          result = firstNumber / secondNumber;
        }
      });

      Then('an error should be returned with message "Division by zero"', () => {
        expect(error).toBe("Division by zero");
        expect(result).toBeNull();
      });
    });
  });
});
