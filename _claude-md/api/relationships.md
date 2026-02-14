## Relationship Taxonomy

| Tag          | UML Analog     | Direction     | Format | Source     | Arrow  |
| ------------ | -------------- | ------------- | ------ | ---------- | ------ |
| `implements` | Realization    | CODE→SPEC     | csv    | TypeScript | `..->` |
| `extends`    | Generalization | CHILD→PARENT  | value  | Any        | `-->>` |
| `uses`       | Dependency     | OUT           | csv    | TypeScript | `-->`  |
| `used-by`    | Dependency     | IN            | csv    | TypeScript | `-->`  |
| `depends-on` | Ordering       | SEQUENCE      | csv    | Gherkin    | `-.->` |
| `enables`    | Ordering       | SEQUENCE      | csv    | Gherkin    | `-.->` |
| `see-also`   | Association    | BIDIRECTIONAL | csv    | Any        | `---`  |
| `api-ref`    | Reference      | DOC→API       | value  | Any        | N/A    |

### Tag Ownership Rules

| Tag                | TypeScript | Gherkin | Why                   |
| ------------------ | ---------- | ------- | --------------------- |
| `uses`             | ✅         | ❌      | Runtime dependencies  |
| `used-by`          | ✅         | ❌      | Reverse of uses       |
| `depends-on`       | ❌         | ✅      | Planning dependencies |
| `enables`          | ❌         | ✅      | What this unblocks    |
| `implements`       | ✅         | ❌      | Behavior test links   |
| `executable-specs` | ❌         | ✅      | Spec file location    |
| `arch-role`        | ✅         | ❌      | Architecture role     |
| `arch-context`     | ✅         | ❌      | Bounded context       |
| `arch-layer`       | ✅         | ❌      | Architecture layer    |

### Workflow-Relationship Matrix

| Workflow           | Required Tags     | Recommended Tags         |
| ------------------ | ----------------- | ------------------------ |
| **Planning**       | `status`, `phase` | `depends-on`, `enables`  |
| **Design**         | `status`, `uses`  | `arch-*` tags, `extends` |
| **Implementation** | `implements`      | `uses`, `used-by`        |
