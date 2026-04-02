@architect
@architect-pattern:AstParserExports
@architect-implements:AstParser
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:Annotation
Feature: TypeScript AST Parser - Export Type Identification
  The AST Parser extracts @architect-* directives from TypeScript source files
  using the TypeScript compiler API. It identifies exports, extracts metadata,
  and validates directive structure.

  Background:
    Given a scanner context with temp directory

  Rule: Export types are correctly identified from TypeScript declarations

      **Invariant:** Every exported TypeScript declaration type (function, type, interface, const, class, enum, abstract class, arrow function, async function, generic function, default export, re-export) is correctly classified.
      **Rationale:** Export type classification drives how codecs render API documentation — misclassifying a function as a const (or vice versa) produces incorrect signatures and misleading docs.
      **Verified by:** Parse function export with directive, Parse type export with directive, Parse interface export with directive, Parse const export with directive, Parse class export with directive, Parse enum export with directive, Parse const enum export with directive, Parse abstract class export with directive, Parse arrow function export with directive, Parse async function export with directive, Parse generic function export with directive, Parse default export with directive, Parse re-exports with directive, Parse multiple exports in single statement, Parse multiple directives in same file

    @function:parseFileDirectives @happy-path
    Scenario: Parse function export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Test function for authentication
         */
        export function authenticate(username: string, password: string): boolean {
          return username === 'admin' && password === 'secret';
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have tag "@architect-core"
      And the directive description should contain "Test function for authentication"
      And the first export should be:
        | field | value        |
        | type  | function     |
        | name  | authenticate |

    @function:parseFileDirectives @happy-path
    Scenario: Parse type export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core @architect-types
         * User type definition
         */
        export type User = {
          id: string;
          name: string;
        };
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the directive should have tags:
        | value              |
        | @architect-core   |
        | @architect-types  |
      And the first export should be:
        | field | value |
        | type  | type  |
        | name  | User  |

    @function:parseFileDirectives @happy-path
    Scenario: Parse interface export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Config interface
         */
        export interface Config {
          apiUrl: string;
          timeout: number;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value     |
        | type  | interface |
        | name  | Config    |

    @function:parseFileDirectives @happy-path
    Scenario: Parse const export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * API configuration
         */
        export const API_CONFIG = {
          baseUrl: 'https://api.example.com',
          version: 'v1'
        };
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value      |
        | type  | const      |
        | name  | API_CONFIG |

    @function:parseFileDirectives @happy-path
    Scenario: Parse class export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * User service class
         */
        export class UserService {
          constructor(private db: Database) {}

          async getUser(id: string) {
            return this.db.findUser(id);
          }
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value       |
        | type  | class       |
        | name  | UserService |

    @function:parseFileDirectives @happy-path
    Scenario: Parse enum export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Enum export
         */
        export enum Status {
          Active = 'active',
          Inactive = 'inactive',
          Pending = 'pending'
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value  |
        | type  | enum   |
        | name  | Status |
      And the directive code should contain "export enum Status"

    @function:parseFileDirectives @happy-path
    Scenario: Parse const enum export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Const enum export
         */
        export const enum Direction {
          Up = 1,
          Down = 2,
          Left = 3,
          Right = 4
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value     |
        | type  | enum      |
        | name  | Direction |
      And the directive code should contain "export const enum Direction"

    @function:parseFileDirectives @happy-path
    Scenario: Parse abstract class export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Abstract class export
         */
        export abstract class BaseService {
          abstract process(): void;

          log(message: string) {
            console.log(message);
          }
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value       |
        | type  | class       |
        | name  | BaseService |

    @function:parseFileDirectives @happy-path
    Scenario: Parse arrow function export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Arrow function export
         */
        export const fetchData = async (url: string): Promise<Response> => {
          return fetch(url);
        };
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value     |
        | type  | const     |
        | name  | fetchData |

    @function:parseFileDirectives @happy-path
    Scenario: Parse async function export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Async function export
         */
        export async function loadData(id: string): Promise<Data> {
          const response = await fetch(`/api/data/${id}`);
          return response.json();
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value    |
        | type  | function |
        | name  | loadData |
      And the directive code should contain "async function loadData"

    @function:parseFileDirectives @happy-path
    Scenario: Parse generic function export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Generic function export
         */
        export function map<T, U>(items: T[], fn: (item: T) => U): U[] {
          return items.map(fn);
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value    |
        | type  | function |
        | name  | map      |
      And the directive code should contain "<T, U>"

    @function:parseFileDirectives @happy-path
    Scenario: Parse default export with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Default export
         */
        export default function authenticate() {
          return true;
        }
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And the first export should be:
        | field | value    |
        | type  | function |
        | name  | default  |

    @function:parseFileDirectives @happy-path
    Scenario: Parse re-exports with directive
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Re-exported utilities
         */
        export { foo, bar } from './utils';
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And 2 exports should be found
      And the exports should include names:
        | value |
        | foo   |
        | bar   |

    @function:parseFileDirectives @happy-path
    Scenario: Parse multiple exports in single statement
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * Multiple exports
         */
        export const USER_ROLE = 'admin', USER_STATUS = 'active';
        """
      When the file is parsed for directives
      Then 1 directive should be found
      And 2 exports should be found
      And the exports should include names:
        | value       |
        | USER_ROLE   |
        | USER_STATUS |

    @function:parseFileDirectives @happy-path
    Scenario: Parse multiple directives in same file
      Given a TypeScript file with content:
        """
        /**
         * @architect-core
         * First function
         */
        export function first() {
          return 'first';
        }

        /**
         * @architect-domain
         * Second function
         */
        export function second() {
          return 'second';
        }
        """
      When the file is parsed for directives
      Then 2 directives should be found
      And the directives should have details:
        | index | tag                 | exportName |
        | 1     | @architect-core    | first      |
        | 2     | @architect-domain  | second     |
