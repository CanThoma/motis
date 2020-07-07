#include "motis/paxforecast/simulate_behavior.h"

#include <cassert>

#include "utl/verify.h"

namespace motis::paxforecast {

void revert_simulated_behavior(simulation_result& sim_result) {
  for (auto const [e, additional] : sim_result.additional_passengers_) {
    e->passengers_ -= additional;
  }
}

}  // namespace motis::paxforecast