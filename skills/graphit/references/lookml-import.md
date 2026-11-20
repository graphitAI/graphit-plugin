# Importing a LookML Project

Load this from semantic-migration.md as soon as the team's definitions turn out to live in LookML. It holds the LookML facts and the import command; semantic-migration.md holds the conversation and its guards, and all of them still apply here.

## Say before starting

- A LookML repository does not hold everything in Looker. Dashboards and Looks built in the Looker UI, with their custom measures and table calculations, live in the Looker instance, and Graphit has no connection to it. They are not part of this.
- LookML dashboard files are not imported either: this brings definitions only.
- Row-level access rules (`access_filter`) do not carry over. In Graphit, owners and admins set data access.

## Dry run first

Use the import for the part that copies as written, never your own translation:

`graphit kb import lookml <dir> --dry-run --org <id>`, with the org id from `graphit status`.

- It converts with fixed rules and writes nothing to Graphit. It does write `plan.json`, `needs-review.md` and `needs-review.json` into the `--out` folder (default `lookml-import/`): say where they landed.
- Its plan is the "copies as written" part of your proposal. Its needs-review list feeds yours: read the files each item names, and never resolve yourself an item that changes what a number means.
- A view lands only on the semantic model already bound to its table's data source. Views without one are listed with the `ds create` command that comes first. Those are the data sources for the slice: still the user's choice, shaped as semantic-migration.md says, each with its build time said first. If they want everything, say the total build time plainly and offer the first slice as the faster start before building anything. Start the approved builds together, not one after another (data-sources.md).
- LookML names its connection on the `connection:` line of each model file, sometimes through a manifest constant, and builds some views from SQL (derived tables) instead of a table; the import lists those for review.
- Pass `--org` on every run. The command refuses when that is not the org you are logged into; never switch orgs or drop the flag to get past it.
- `--sandbox-model`, `--map` and `--replace` change what is imported, bound or overwritten. Explain what each would do here and let the user decide; never add one yourself. `--replace` takes LookML's version of every differing definition in the run, not one: show its dry run before they decide.

## Show what comes in, then ask little

After the dry run, your reply is a picture of the semantic layer they are about to get. It comes before any review item:

- The models, grouped by business area, a line each.
- The headline metrics in plain words, each with what it means: what it counts and what it leaves out, read from its definition, never guessed. A few of them, with the total count.
- The rules it found and what each enforces.

Then only the decisions that change what a number means, such as a conflicting definition or a rule that cannot apply across separate data sources. Ask those and nothing else.

Everything else gets a default, said in one line they can override, never a question each: labels kept as in the source and the dates the import picked. Where it all lives is semantic-migration.md's one placement question: the import creates no group, and each metric lands with its model. What the import left out comes last, as a short list.

## Always-applied filters

`sql_always_where` always excludes rows; when it sits on one column of the view, the import plans it as a rule. `always_filter` only requires a filter whose value users can change, and the import lists it for review instead. Say which is which, and what each rule would enforce.

## Apply

The first dry run binds nothing until the slice's data sources exist. Once they are ready, run the dry run again with the flags the user chose and show what comes in from that plan, as above. Only after they approve it, run the same command without `--dry-run`.

- It writes the whole plan, its rules included, and a saved rule enforces at once. It cannot leave out one item they reject (`--sandbox-model` leaves out a whole LookML model): say so and ask how to go on.
- Anything that already exists in another form, a model's dimensions, entities, default time dimension and label included, is listed, not overwritten, unless they chose `--replace`; anything identical is not written twice.
- It stops at the first item the server refuses. Read the results, fix what the error names, and run it again.
- In an org whose knowledge base a repository owns it refuses to write: follow the repository path in semantic-migration.md.
