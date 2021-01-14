const App = require("@live-change/framework")
const app = new App()

const validators = require("../validation")

const definition = app.createServiceDefinition({
  name: "partials",
  validators
})

const Partial = definition.model({
  name: "Partial",
  properties: {
    name: {
      type: String,
      validation: ['nonEmpty']
    },
    data: {
      type: Object,
      validation: ['nonEmpty']
    },
    definition: {
      type: Object,
      validation: ['nonEmpty']
    }
  },
  indexes: {
    byName: {
      property: "name"
    },
    dataByName: {
      function: async (input, output, { }) => {
        const mapper = (obj) => ({ id: obj.name, data: obj.data })
        await input.table("partials_Partial").onChange(
            (obj, oldObj) => output.change(obj && mapper(obj), oldObj && mapper(oldObj))
        )
      }
    }
  },
  crud: {
    deleteTrigger: true,
    updateMethod: 'create',
    options: {
      access: (params, {client, service}) => {
        return client.roles && ( client.roles.includes('admin') || client.roles.includes('partials') )
      }
    },
    readOptions: {
      access: () => true
    }
  }
})

definition.view({
  name: "partial",
  properties: {
    partial: {
      type: Partial
    }
  },
  returns: {
    type: Object
  },
  daoPath({ partial }) {
    return ['database', 'indexObject', app.databaseName, 'partials_Partial_dataByName', partial]
  }
})

module.exports = definition

async function start() {
  app.processServiceDefinition(definition, [...app.defaultProcessors])
  await app.updateService(definition)//, { force: true })
  const service = await app.startService(definition, { runCommands: true, handleEvents: true })

  //require("../config/metricsWriter.js")(definition.name, () => ({}))
}

if (require.main === module) start().catch(error => {
  console.error(error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})