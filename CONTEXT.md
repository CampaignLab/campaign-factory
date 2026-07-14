# Campaign Factory

Campaign Factory's shared language for designing UK local and public-policy campaigns.

## Language

**Hyperlocal Campaign**:
A campaign focused on changing one concrete decision affecting one named place or community, even when several institutions or decision-makers influence it.
_Avoid_: Local variant, replicated campaign, borough rollout

**Verification Run**:
A human-triggered agent task that checks or re-checks selected campaign claims against current public evidence, recording a new dated result without overwriting the earlier finding.
_Avoid_: Fact refresh, automatic correction, silent update

**Decision-Route Watcher**:
A read-only agent assigned to a Hyperlocal Campaign that monitors the public sources governing its decision and surfaces candidate changes for verification and human review.
_Avoid_: Parliament watcher, autonomous monitor, automatic campaign updater

**Mission Bay** _(working name)_:
A page belonging to exactly one Hyperlocal Campaign, entered after its main journey, where a campaigner deploys bounded agent missions using that campaign's approved context. Work spanning several campaigns belongs in a separate portfolio view.
_Avoid_: Operations console, chatbot page, agent marketplace

**Agent Mission**:
A substantial, human-initiated campaign outcome delegated to a coordinated agent team. It contains at least two independently useful workstreams, a synthesis, critique, or adjudication step, and returns a structured artefact for a meaningful human decision.
_Avoid_: Single-agent task, agent persona, open-ended chat, autonomous political action

**Agent Action**:
A bounded task performed by one agent, such as verifying one claim, retrieving one public document, or finding one meeting. An Agent Action may be launched directly in the campaign or used as one step within an Agent Mission, but is not a Mission Bay catalogue item.
_Avoid_: Mission, agent team, workflow

**Factory Visualisation**:
A human-readable representation of how an Agent Mission divides work, coordinates specialist processes, checks results, and returns an artefact for approval. It is an explanatory model of orchestration, not a literal picture of autonomous beings or runtime infrastructure.
_Avoid_: Agent simulation, digital workforce, literal system map

**Mission Purpose**:
The campaign outcome used to organise and browse Mission Bay: Challenge, Investigate, Watch, or Prepare. It describes why a campaigner would deploy a mission, independently of how its agent team is orchestrated.
_Avoid_: Tier, agent type, workflow pattern

**Mission Catalogue**:
The curated set of twelve canonical Agent Missions shown in Mission Bay, with three missions for each Mission Purpose. It is a bounded capability map, not an exhaustive inventory of every task an agent could perform.
_Avoid_: Agent marketplace, prompt library, complete list of possible agents

**Factory Pattern**:
The visible coordination shape used by an Agent Mission, such as a Parallel Team, Tribunal, Persistent Loop, or Response Loop. It explains how work is divided and reconciled without becoming Mission Bay's primary navigation.
_Avoid_: Mission category, capability tier, agent count

**Token Win**:
A concession that creates the appearance of campaign progress but does not materially advance the campaign's purpose, build useful power, or improve the route to the main objective.
_Avoid_: Minimum Viable Win, stepping-stone win, partial victory

**Formal Decision Route**:
The documented chain of authority, procedural stages, public bodies, and known dates through which a campaign's target decision can be made. It excludes informal influence unless that influence is separately labelled as strategic inference.
_Avoid_: Who really decides, power map, inferred influence
