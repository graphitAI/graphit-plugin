# Connect a Warehouse or File

Load this from first-run.md when a new org connects its first data. It holds the mechanics; first-run.md holds the conversation. Say everything in your own words; the facts and guards here are fixed.

## Ask where the data lives

This is a closed choice: Snowflake, BigQuery, or a CSV or Excel file. Ask for read-only access, with the reason in the user's terms: their own numbers. Say you will read it directly to look around and answer their first question. If they ask what access means: read-only, and Graphit keeps only the results they ask for.

- A source Graphit doesn't support yet (for example DynamoDB): say so plainly and offer to start from a CSV export of a table.
- Connecting a warehouse needs an org admin (`role` owner or admin). For anyone else, draft a short note they can send their admin asking to connect the warehouse, and offer the file path meanwhile.
- No sample data.

**File:** ask for the path, then upload it as onboarding.md (File) describes. A small file takes seconds.

**BigQuery:** `graphit connector add bigquery-serviceaccount --help` lists what to ask for. Pass the service-account key file by path; never read or print it.

## Snowflake

Snowflake signs in with a key pair. If the user already gave the details, use them. Otherwise ask how Graphit should sign in, as a closed choice: they already have a key and a user for it; create a Graphit user for them (needs a Snowflake admin); or use their own Snowflake user. Then follow the matching step:

1. Ask for the private key file path (`.p8`) and the account, user, role, warehouse and database. If they don't know the values, give only step 3's SELECT line.
2. Generate the key pair locally (below). Ask for the warehouse and database names, then give this snippet for a Snowflake admin, values filled in:
   ```sql
   CREATE ROLE IF NOT EXISTS GRAPHIT_ROLE;
   CREATE USER IF NOT EXISTS GRAPHIT_SVC TYPE=SERVICE DEFAULT_ROLE=GRAPHIT_ROLE DEFAULT_WAREHOUSE={warehouse} RSA_PUBLIC_KEY='{public key}';
   GRANT ROLE GRAPHIT_ROLE TO USER GRAPHIT_SVC;
   GRANT USAGE ON WAREHOUSE {warehouse} TO ROLE GRAPHIT_ROLE;
   GRANT USAGE ON DATABASE {database} TO ROLE GRAPHIT_ROLE;
   GRANT USAGE ON ALL SCHEMAS IN DATABASE {database} TO ROLE GRAPHIT_ROLE;
   GRANT SELECT ON ALL TABLES IN DATABASE {database} TO ROLE GRAPHIT_ROLE;
   ```
   The role only reads. Wait for "done".
3. Generate the key pair locally, then give one snippet to run in a Snowsight worksheet and ask them to paste back the result row:
   ```sql
   EXECUTE IMMEDIATE 'ALTER USER "' || CURRENT_USER() || '" SET RSA_PUBLIC_KEY_2=''{public key}''';
   SELECT CURRENT_ORGANIZATION_NAME()||'-'||CURRENT_ACCOUNT_NAME() AS account, CURRENT_USER() AS user, CURRENT_ROLE() AS role, CURRENT_WAREHOUSE() AS warehouse, CURRENT_DATABASE() AS database;
   ```
   If a value comes back empty, ask for that one value only.

Generating the key pair: write it under `~/.graphit/keys/`, private key unencrypted PKCS#8 with mode 600:
`openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out <key>.p8 && chmod 600 <key>.p8 && openssl rsa -in <key>.p8 -pubout`
Put only the public key body (no BEGIN/END lines) into the snippet. Never print, paste or read the private key into the conversation; pass it by path:
`graphit connector add snowflake-keypair --account ... --user ... --role ... --warehouse ... --database ... --key <key>.p8`
The command tests the connection before saving, so success means connected. The CLI reads the key file and Graphit stores the key, encrypted, with the connection so it can run queries; you never read it yourself.

**A key the user pasted** is the one exception: it is already in the conversation. Save it once with a shell heredoc under `umask 077` into `~/.graphit/keys/<name>.p8`, so no one else can read the file even for a moment, then pass it by path and never show, quote or read it again. Tell them in one line where it is saved, that a file path is enough next time, and that a key pasted in chat is worth rotating when convenient. No lecture.

Then return to first-run.md for the scan and the overview.
