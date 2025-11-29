# /bollalabz - BollaLabz Command Center

Invoke the **BollaLabz Overlord** agent to handle this request. Use the Task tool with `subagent_type: "bollalabz-overlord"` to spawn the supreme authority.

Pass the user's full request to the agent. If no specific command is given, perform a general status and health check.

## Available Commands

- (no args) - General status and health check
- `vision check` - Verify alignment with the creator's vision
- `stack verify` - Validate tech stack versions
- `schema check` - Audit database schema
- `voice audit` - Check voice pipeline latency
- `memory budget` - Review 8GB VPS allocations
- `api audit` - List endpoints and verify auth
- `deploy check` - Pre-deployment verification
- `summon [specialist]` - Spawn specialist (DatabaseArchitect, VoiceEngineer, FrontendCrafter, APISentinel, WorkflowOrchestrator, InfrastructureGuardian)
- `status` - Overall project health

## User Request

$ARGUMENTS
